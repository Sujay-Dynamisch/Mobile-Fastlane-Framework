# =============================================================================
# Firebase App Testing Agent - Email Notifier
# =============================================================================
# frozen_string_literal: true

begin
  require "net/smtp"
rescue LoadError
  # Handled gracefully if net-smtp is not in bundle
end
require "time"

module EmailNotifier
  module_function

  # Send test outcome email report (Success or Failure)
  #
  # Required report contents:
  #   - Project name
  #   - Environment
  #   - Build number
  #   - Test execution status
  #   - Total tests
  #   - Passed tests
  #   - Failed tests
  #   - Failed test names/IDs when available
  #   - Failed devices when available
  #   - Firebase test result URL
  #   - Test execution duration
  def send_test_report(project:, environment:, build:, results:, config: {})
    status = results[:status].to_s.upcase
    return unless notifications_enabled?(status, config)

    recipients = resolve_recipients(config)
    return if recipients.empty?

    subject = "[#{status}] Firebase App Testing Agent: #{project} (#{environment.upcase}) - Build #{build}"
    timestamp = Time.now.utc.strftime("%Y-%m-%d %H:%M:%S UTC")

    text_body = build_text_body(
      project: project,
      environment: environment,
      build: build,
      results: results,
      timestamp: timestamp
    )

    html_body = build_html_body(
      project: project,
      environment: environment,
      build: build,
      results: results,
      timestamp: timestamp
    )

    deliver_smtp(
      recipients: recipients,
      subject: subject,
      text_body: text_body,
      html_body: html_body,
      config: config
    )
  end

  def notifications_enabled?(status, config)
    # Test reports are configured in testing.yml (notifications.email) and can be
    # overridden per environment under app_testing.notifications.email. The
    # environment's release notifications block is intentionally not used here.
    email_cfg = config.dig("app_testing", "notifications", "email") ||
                DistributionConfig.testing.dig("notifications", "email") || {}
    return false if email_cfg.fetch("enabled", true) == false

    if status == "PASSED"
      email_cfg.fetch("notify_on_success", true) != false
    else
      email_cfg.fetch("notify_on_failure", true) != false
    end
  end

  def resolve_recipients(config)
    raw = ENV["TEST_ALERT_EMAIL_RECIPIENTS"]
    raw = ENV["SMTP_TO"] if raw.nil? || raw.to_s.strip.empty?
    raw = ENV["RELEASE_EMAIL_RECIPIENTS"] if raw.nil? || raw.to_s.strip.empty?

    if raw.nil? || raw.to_s.strip.empty?
      raw = config.dig("app_testing", "notifications", "email", "recipients") ||
            DistributionConfig.testing.dig("notifications", "email", "recipients")
    end

    return [] if raw.nil?

    case raw
    when Array
      raw.map(&:to_s).map(&:strip).reject { |e| e.empty? || e.start_with?("${") }
    when String
      raw.split(/[,\s;]+/).map(&:strip).reject { |e| e.empty? || e.start_with?("${") }
    else
      []
    end
  end

  def deliver_smtp(recipients:, subject:, text_body:, html_body:, config:)
    unless defined?(Net::SMTP)
      warn_msg = "[EmailNotifier] 'net-smtp' library is not available. Please run 'bundle install' to enable email reports."
      defined?(UI) ? UI.important(warn_msg) : warn(warn_msg)
      return
    end

    host = ENV["SMTP_HOST"].to_s.strip
    host = config.dig("notifications", "email", "smtp_host").to_s.strip if host.empty?
    if host.empty? || host.start_with?("${")
      # Log warning if SMTP is not configured
      warn_msg = "[EmailNotifier] SMTP_HOST not set; skipping email alert."
      defined?(UI) ? UI.important(warn_msg) : warn(warn_msg)
      return
    end

    port_raw = ENV["SMTP_PORT"].to_s.strip
    port_raw = config.dig("notifications", "email", "smtp_port").to_s.strip if port_raw.empty?
    port = port_raw.empty? || port_raw.start_with?("${") ? 587 : port_raw.to_i

    user = ENV["SMTP_USERNAME"].to_s.strip
    user = ENV["SMTP_USER"].to_s.strip if user.empty?
    user = config.dig("notifications", "email", "username").to_s.strip if user.empty?
    user = nil if user.to_s.start_with?("${") || user.to_s.empty?

    password = ENV["SMTP_PASSWORD"].to_s.strip
    password = ENV["SMTP_PASS"].to_s.strip if password.empty?
    password = config.dig("notifications", "email", "password").to_s.strip if password.empty?
    password = nil if password.to_s.start_with?("${") || password.to_s.empty?

    from = ENV["SMTP_FROM"].to_s.strip
    from = ENV["RELEASE_EMAIL_FROM"].to_s.strip if from.empty?
    from = config.dig("notifications", "email", "from").to_s.strip if from.empty?
    from = "no-reply@firebase-testing.internal" if from.empty? || from.start_with?("${")

    boundary = "----=_Part_#{Time.now.to_i}_#{rand(100_000)}"

    message = <<~MESSAGE
      From: Firebase App Testing Agent <#{from}>
      To: #{recipients.join(', ')}
      Subject: #{subject}
      Date: #{Time.now.rfc2822}
      MIME-Version: 1.0
      Content-Type: multipart/alternative; boundary="#{boundary}"

      --#{boundary}
      Content-Type: text/plain; charset=UTF-8
      Content-Transfer-Encoding: 7bit

      #{text_body}

      --#{boundary}
      Content-Type: text/html; charset=UTF-8
      Content-Transfer-Encoding: 7bit

      #{html_body}

      --#{boundary}--
    MESSAGE

    smtp = Net::SMTP.new(host, port)
    smtp.enable_starttls_auto if smtp.respond_to?(:enable_starttls_auto) && port != 465

    if port == 465 && smtp.respond_to?(:enable_tls)
      smtp.enable_tls
    end

    if user && password
      smtp.start("localhost", user, password, :plain) do |session|
        session.send_message(message, from, recipients)
      end
    else
      smtp.start("localhost") do |session|
        session.send_message(message, from, recipients)
      end
    end

    success_msg = "[EmailNotifier] Test report email sent to #{recipients.join(', ')}"
    defined?(UI) ? UI.message(success_msg) : puts(success_msg)
  rescue StandardError => e
    # Requirement 12: If email sending itself fails, do not hide original AI test failure.
    # Log the email error clearly.
    err_msg = "[EmailNotifier] Failed to send email report: #{e.message}"
    defined?(UI) ? UI.error(err_msg) : warn(err_msg)
  end

  def build_text_body(project:, environment:, build:, results:, timestamp:)
    status = results[:status]
    failed_names = results[:failed_test_names]
    failed_devs = results[:failed_devices]

    lines = [
      "FIREBASE APP TESTING AGENT - TEST REPORT",
      "=" * 50,
      "Project: #{project}",
      "Environment: #{environment.upcase}",
      "Build Number: #{build}",
      "Execution Status: #{status}",
      "Total Tests: #{results[:total_tests]}",
      "Passed Tests: #{results[:passed_tests]}",
      "Failed Tests: #{results[:failed_tests]}",
      "Execution Duration: #{results[:duration]}",
      "Timestamp: #{timestamp}"
    ]

    lines << "Failed Test Names/IDs: #{failed_names.join(', ')}" unless failed_names.empty?
    lines << "Failed Devices: #{failed_devs.join(', ')}" unless failed_devs.empty?
    lines << "Failure Reason: #{results[:error_reason]}" if results[:error_reason]
    lines << "Firebase Result URL: #{results[:firebase_url]}" if results[:firebase_url]

    lines << ""
    lines << "Configured Test Cases:"
    results[:test_case_ids].each { |id| lines << "  - #{id}" }

    lines.join("\n")
  end

  def build_html_body(project:, environment:, build:, results:, timestamp:)
    status = results[:status]
    passed = status == "PASSED"
    header_color = passed ? "#059669" : "#dc2626"
    badge_text = passed ? "All Tests Passed" : "Tests Failed"

    failed_names_str = results[:failed_test_names].empty? ? "None" : results[:failed_test_names].map { |n| "<code>#{n}</code>" }.join(", ")
    failed_devs_str = results[:failed_devices].empty? ? "None" : results[:failed_devices].map { |d| "<code>#{d}</code>" }.join(", ")

    test_cases_list = results[:test_case_ids].map { |id| "<li><code>#{id}</code></li>" }.join

    <<~HTML
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; margin: 0; }
          .card { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #{header_color}; color: #ffffff; padding: 22px 24px; }
          .badge { display: inline-block; background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .title { margin: 8px 0 0 0; font-size: 20px; font-weight: 700; }
          .content { padding: 24px; }
          .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
          .stat-num { font-size: 24px; font-weight: 700; }
          .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 160px 1fr; row-gap: 10px; font-size: 14px; margin-bottom: 20px; }
          .label { color: #64748b; font-weight: 600; }
          .value { color: #0f172a; font-weight: 500; }
          .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; color: #991b1b; font-size: 13px; line-height: 1.5; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.5; }
          ul { margin: 6px 0 0 0; padding-left: 20px; }
          code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
          .btn { display: inline-block; background: #{header_color}; color: #ffffff !important; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 18px; }
          .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">#{badge_text}</span>
            <h1 class="title">Firebase App Testing Agent Report</h1>
          </div>
          <div class="content">
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-num" style="color: #0f172a;">#{results[:total_tests]}</div>
                <div class="stat-label">Total Tests</div>
              </div>
              <div class="stat-box">
                <div class="stat-num" style="color: #059669;">#{results[:passed_tests]}</div>
                <div class="stat-label">Passed</div>
              </div>
              <div class="stat-box">
                <div class="stat-num" style="color: #{results[:failed_tests] > 0 ? '#dc2626' : '#64748b'};">#{results[:failed_tests]}</div>
                <div class="stat-label">Failed</div>
              </div>
            </div>

            #{results[:error_reason] ? "<div class='alert-box'><strong>Failure Reason:</strong> #{results[:error_reason]}</div>" : ''}

            <div class="grid">
              <span class="label">Project Name</span><span class="value">#{project}</span>
              <span class="label">Environment</span><span class="value">#{environment.upcase}</span>
              <span class="label">Build Number</span><span class="value">#{build}</span>
              <span class="label">Execution Status</span><span class="value" style="font-weight: 700; color: #{header_color};">#{status}</span>
              <span class="label">Test Duration</span><span class="value">#{results[:duration]}</span>
              <span class="label">Failed Test Names/IDs</span><span class="value">#{failed_names_str}</span>
              <span class="label">Failed Devices</span><span class="value">#{failed_devs_str}</span>
              <span class="label">Timestamp</span><span class="value">#{timestamp}</span>
            </div>

            <div class="box">
              <strong>Executed Test Case IDs:</strong>
              <ul>#{test_cases_list}</ul>
              <div style="margin-top: 10px;">
                <strong>Test Devices:</strong> <code>#{results[:devices]}</code>
              </div>
            </div>

            #{results[:firebase_url] ? "<p><a class='btn' href='#{results[:firebase_url]}' target='_blank'>View Firebase Test Results</a></p>" : ''}
          </div>
          <div class="footer">
            Automated test report generated by Fastlane Firebase App Testing Agent integration.
          </div>
        </div>
      </body>
      </html>
    HTML
  end
end
