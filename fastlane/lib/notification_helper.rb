# frozen_string_literal: true

require "json"
require "net/http"
require "time"
require "uri"

module NotificationHelper
  module_function

  def notify_success(platform:, environment:, project:, version:, build:, artifact:, release_url: nil, config: {})
    message = success_message(
      platform: platform,
      environment: environment,
      project: project,
      version: version,
      build: build,
      artifact: artifact,
      release_url: release_url
    )

    card = teams_card(
      title: "Build Distributed",
      subtitle: "#{project} · #{platform} · #{environment.to_s.upcase}",
      status: "SUCCESS",
      facts: build_facts(platform, environment, version, build, artifact),
      actions: [link_action("Open Release", release_url), ci_run_action].compact
    )

    dispatch(message, config, card)
  end

  def notify_failure(platform:, environment:, project:, error:, config: {})
    message = failure_message(
      platform: platform,
      environment: environment,
      project: project,
      error: error
    )

    card = teams_card(
      title: "Distribution Failed",
      subtitle: "#{project} · #{platform} · #{environment.to_s.upcase}",
      status: "FAILED",
      facts: [["Platform", platform], ["Environment", environment.to_s.upcase], ["Finished", timestamp]],
      sections: [alert_section("Error", truncate(error))],
      actions: [ci_run_action].compact
    )

    dispatch(message, config, card)
  end

  # Sends the Firebase App Testing Agent report (results from TestResultParser).
  def notify_test_report(platform:, environment:, project:, version:, build:, artifact:, results:, config: {})
    passed = results[:status].to_s.upcase == "PASSED"
    failed_names = Array(results[:failed_test_names])

    test_rows = Array(results[:test_case_ids]).map do |id|
      icon = if failed_names.include?(id) then "❌"
             elsif passed then "✅"
             else "⚠️"
             end
      { "type" => "TextBlock", "text" => "#{icon}  #{id}", "wrap" => true, "spacing" => "Small", "fontType" => "Monospace" }
    end

    sections = [stats_section(results)]
    unless test_rows.empty?
      sections << {
        "type" => "Container",
        "spacing" => "Medium",
        "separator" => true,
        "items" => [heading("Test Cases")] + test_rows
      }
    end

    device_rows = devices_section(results[:devices])
    sections << device_rows if device_rows

    unless passed
      details = [results[:error_reason] || results[:error_message]]
      details << "Failed devices: #{results[:failed_devices].join(', ')}" if Array(results[:failed_devices]).any?
      details << "Failed tests: #{failed_names.join(', ')}" if failed_names.any?
      sections << alert_section("Failure Details", truncate(details.compact.join("\n\n")))
    end

    facts = build_facts(platform, environment, version, build, artifact)

    card = teams_card(
      title: "App Testing Agent Report",
      subtitle: "#{project} · #{platform} · #{environment.to_s.upcase}",
      status: passed ? "PASSED" : "FAILED",
      facts: facts,
      sections: sections,
      actions: [link_action("View Firebase Results", results[:firebase_url]), ci_run_action].compact
    )

    dispatch(test_report_message(platform, environment, project, version, build, results), config, card)
  end

  def dispatch(message, config, card = nil)
    teams = config.fetch("teams", {})
    slack = config.fetch("slack", {})

    send_webhook("Microsoft Teams", teams, card || teams_card_payload(message)) if teams.fetch("enabled", false)
    send_webhook("Slack", slack, { "text" => message }) if slack.fetch("enabled", false)
  rescue StandardError => e
    UI.important("Notification integration failed: #{e.message}")
  end

  def send_webhook(name, config, payload)
    webhook = config["webhook_url"].to_s.strip

    if webhook.match?(/\A\$\{[A-Z][A-Z0-9_]*\}\z/)
      variable_name = webhook[2..-2]
      webhook = ENV[variable_name].to_s.strip
    end

    raise "#{name} webhook URL is not configured." if webhook.empty?

    uri = URI.parse(webhook)
    request = Net::HTTP::Post.new(uri.request_uri)
    request["Content-Type"] = "application/json; charset=utf-8"
    request.body = JSON.generate(payload)

    response = Net::HTTP.start(
      uri.host,
      uri.port,
      use_ssl: uri.scheme == "https",
      open_timeout: 10,
      read_timeout: 20
    ) do |http|
      http.request(request)
    end

    unless response.is_a?(Net::HTTPSuccess)
      raise "#{name} webhook returned #{response.code}: #{response.body}"
    end

    UI.message("#{name} notification sent (HTTP #{response.code}).") if defined?(UI)
  end

  # ---------------------------------------------------------------------------
  # Teams Adaptive Card builders (Teams Workflows webhooks require this format)
  # ---------------------------------------------------------------------------

  STATUS_STYLES = {
    "PASSED" => { style: "good", color: "Good", icon: "✅" },
    "SUCCESS" => { style: "good", color: "Good", icon: "🚀" },
    "FAILED" => { style: "attention", color: "Attention", icon: "❌" }
  }.freeze

  def teams_card(title:, subtitle:, status:, facts:, sections: [], actions: [])
    look = STATUS_STYLES.fetch(status, STATUS_STYLES["SUCCESS"])

    header = {
      "type" => "Container",
      "style" => look[:style],
      "bleed" => true,
      "items" => [
        {
          "type" => "ColumnSet",
          "columns" => [
            {
              "type" => "Column",
              "width" => "stretch",
              "items" => [
                { "type" => "TextBlock", "text" => "FASTLANE · CI/CD", "size" => "Small", "weight" => "Bolder", "isSubtle" => true, "spacing" => "None" },
                { "type" => "TextBlock", "text" => title, "size" => "Large", "weight" => "Bolder", "wrap" => true, "spacing" => "None" },
                { "type" => "TextBlock", "text" => subtitle, "isSubtle" => true, "wrap" => true, "spacing" => "None" }
              ]
            },
            {
              "type" => "Column",
              "width" => "auto",
              "verticalContentAlignment" => "Center",
              "items" => [
                { "type" => "TextBlock", "text" => "#{look[:icon]} #{status}", "weight" => "Bolder", "size" => "Medium", "color" => look[:color] }
              ]
            }
          ]
        }
      ]
    }

    details = {
      "type" => "Container",
      "spacing" => "Medium",
      "items" => [
        heading("Build Details"),
        {
          "type" => "FactSet",
          "facts" => facts.reject { |_, v| v.to_s.empty? }.map { |k, v| { "title" => k, "value" => v.to_s } }
        }
      ]
    }

    footer = {
      "type" => "TextBlock",
      "text" => "Sent by Fastlane · #{timestamp}",
      "size" => "Small",
      "isSubtle" => true,
      "separator" => true,
      "spacing" => "Medium",
      "wrap" => true
    }

    content = {
      "$schema" => "http://adaptivecards.io/schemas/adaptive-card.json",
      "type" => "AdaptiveCard",
      "version" => "1.4",
      "msteams" => { "width" => "Full" },
      "body" => [header] + sections.first(1) + [details] + sections.drop(1) + [footer]
    }
    content["actions"] = actions unless actions.empty?

    wrap_card(content)
  end

  # Plain-text fallback card.
  def teams_card_payload(message)
    wrap_card(
      "$schema" => "http://adaptivecards.io/schemas/adaptive-card.json",
      "type" => "AdaptiveCard",
      "version" => "1.4",
      "body" => message.split("\n").reject(&:empty?).each_with_index.map do |line, index|
        block = { "type" => "TextBlock", "text" => line, "wrap" => true }
        index.zero? ? block.merge("weight" => "Bolder", "size" => "Medium") : block.merge("spacing" => "None")
      end
    )
  end

  def wrap_card(content)
    {
      "type" => "message",
      "attachments" => [
        { "contentType" => "application/vnd.microsoft.card.adaptive", "contentUrl" => nil, "content" => content }
      ]
    }
  end

  def stats_section(results)
    stat = lambda do |value, label, color|
      {
        "type" => "Column",
        "width" => "stretch",
        "items" => [
          { "type" => "TextBlock", "text" => value.to_s, "size" => "ExtraLarge", "weight" => "Bolder", "color" => color, "horizontalAlignment" => "Center" },
          { "type" => "TextBlock", "text" => label, "size" => "Small", "isSubtle" => true, "horizontalAlignment" => "Center", "spacing" => "None" }
        ]
      }
    end

    {
      "type" => "Container",
      "style" => "emphasis",
      "spacing" => "Medium",
      "items" => [
        {
          "type" => "ColumnSet",
          "columns" => [
            stat.call(results[:total_tests], "TOTAL", "Default"),
            stat.call(results[:passed_tests], "PASSED", "Good"),
            stat.call(results[:failed_tests], "FAILED", results[:failed_tests].to_i.positive? ? "Attention" : "Default"),
            stat.call(results[:duration], "DURATION", "Accent")
          ]
        }
      ]
    }
  end

  ANDROID_VERSIONS = {
    "30" => "11", "31" => "12", "32" => "12L", "33" => "13", "34" => "14", "35" => "15", "36" => "16"
  }.freeze

  DEVICE_NAMES = {
    "a54x" => "Galaxy A54",
    "o1q" => "Galaxy S21",
    "pa3q" => "Galaxy S25 Ultra",
    "oriole" => "Pixel 6",
    "tokay" => "Pixel 9",
    "TB370FU" => "Lenovo Tab P12",
    "MediumPhone.arm" => "Medium Phone (Emulator)"
  }.freeze

  # Parses "model=a54x,version=34,locale=en,orientation=portrait;..." and merges
  # entries that differ only by orientation/locale.
  def parse_devices(devices)
    grouped = {}

    devices.to_s.split(";").each do |entry|
      attrs = entry.split(",").to_h { |pair| pair.split("=", 2).map(&:strip) }
      model = attrs["model"].to_s
      next if model.empty?

      device = grouped[[model, attrs["version"]]] ||= { model: model, version: attrs["version"], orientations: [], locales: [] }
      device[:orientations] |= [attrs["orientation"].to_s.capitalize] unless attrs["orientation"].to_s.empty?
      device[:locales] |= [attrs["locale"].to_s.upcase] unless attrs["locale"].to_s.empty?
    end

    grouped.values
  end

  def devices_section(devices)
    parsed = parse_devices(devices)
    return nil if parsed.empty?

    rows = parsed.map do |device|
      android = ANDROID_VERSIONS[device[:version].to_s]
      version_label = android ? "Android #{android}" : "API #{device[:version]}"

      {
        "type" => "ColumnSet",
        "separator" => true,
        "spacing" => "Small",
        "columns" => [
          {
            "type" => "Column",
            "width" => "stretch",
            "items" => [
              { "type" => "TextBlock", "text" => "📱 **#{DEVICE_NAMES.fetch(device[:model], device[:model])}**", "wrap" => true },
              { "type" => "TextBlock", "text" => device[:model], "size" => "Small", "isSubtle" => true, "spacing" => "None" }
            ]
          },
          {
            "type" => "Column",
            "width" => "auto",
            "items" => [
              { "type" => "TextBlock", "text" => version_label, "weight" => "Bolder", "color" => "Accent", "horizontalAlignment" => "Right" },
              {
                "type" => "TextBlock",
                "text" => (device[:orientations] + device[:locales]).join(" · "),
                "size" => "Small",
                "isSubtle" => true,
                "horizontalAlignment" => "Right",
                "spacing" => "None"
              }
            ]
          }
        ]
      }
    end

    {
      "type" => "Container",
      "spacing" => "Medium",
      "separator" => true,
      "items" => [heading("Test Devices (#{parsed.size})")] + rows
    }
  end

  def alert_section(title, text)
    {
      "type" => "Container",
      "style" => "attention",
      "spacing" => "Medium",
      "items" => [
        { "type" => "TextBlock", "text" => title, "weight" => "Bolder", "color" => "Attention" },
        { "type" => "TextBlock", "text" => text.to_s, "wrap" => true, "spacing" => "Small" }
      ]
    }
  end

  def heading(text)
    { "type" => "TextBlock", "text" => text, "weight" => "Bolder", "size" => "Medium" }
  end

  def build_facts(platform, environment, version, build, artifact)
    [
      ["Platform", platform],
      ["Environment", environment.to_s.upcase],
      ["Version", version],
      ["Build", build],
      ["Artifact", artifact ? File.basename(artifact.to_s) : nil],
      ["Branch", ENV["GITHUB_REF_NAME"]],
      ["Commit", ENV["GITHUB_SHA"].to_s[0, 7]],
      ["Triggered By", ENV["GITHUB_ACTOR"] || "Local run"]
    ]
  end

  def link_action(title, url)
    return nil if url.to_s.strip.empty?

    { "type" => "Action.OpenUrl", "title" => title, "url" => url }
  end

  def ci_run_action
    server, repo, run_id = ENV.values_at("GITHUB_SERVER_URL", "GITHUB_REPOSITORY", "GITHUB_RUN_ID")
    return nil if [server, repo, run_id].any? { |v| v.to_s.empty? }

    link_action("View CI Run", "#{server}/#{repo}/actions/runs/#{run_id}")
  end

  def timestamp
    Time.now.strftime("%d %b %Y, %H:%M %Z")
  end

  def truncate(text, limit = 800)
    text = text.to_s
    text.length > limit ? "#{text[0, limit]}…" : text
  end

  # ---------------------------------------------------------------------------
  # Plain-text messages (Slack + fallback)
  # ---------------------------------------------------------------------------

  def test_report_message(platform, environment, project, version, build, results)
    lines = [
      "[#{results[:status]}] Firebase App Testing Agent report",
      "",
      "Project: #{project}",
      "Platform: #{platform}",
      "Environment: #{environment}",
      "Version: #{version} (#{build})",
      "Tests: #{results[:passed_tests]}/#{results[:total_tests]} passed, #{results[:failed_tests]} failed",
      "Duration: #{results[:duration]}"
    ]
    lines << "Reason: #{results[:error_reason]}" if results[:error_reason]
    lines << "Results: #{results[:firebase_url]}" if results[:firebase_url]
    lines.join("\n")
  end

  def success_message(platform:, environment:, project:, version:, build:, artifact:, release_url:)
    lines = [
      "[INFO] Mobile build distributed",
      "",
      "Project: #{project}",
      "Platform: #{platform}",
      "Environment: #{environment}",
      "Version: #{version}",
      "Build: #{build}",
      "Artifact: #{File.basename(artifact)}"
    ]

    lines << "Release: #{release_url}" if release_url && !release_url.empty?
    lines.join("\n")
  end

  def failure_message(platform:, environment:, project:, error:)
    [
      "[ALERT] Mobile distribution failed",
      "",
      "Project: #{project}",
      "Platform: #{platform}",
      "Environment: #{environment}",
      "Error: #{error}"
    ].join("\n")
  end
end
