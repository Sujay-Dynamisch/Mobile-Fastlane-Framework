# frozen_string_literal: true

require_relative "config_loader"
require_relative "profile_store"
require_relative "project_detector"

# Interactive per-run setup: pick a saved profile or create a new one.
# Returns a profile hash (see fastlane/config/profiles/*.yml).
module SetupWizard
  USE_LAST = "Use last setup"
  USE_SAVED = "Use a saved setup"
  CREATE = "Create new setup"
  EDIT = "Edit a saved setup"
  DELETE = "Delete a saved setup"
  NONE = "(none)"

  class << self
    def start
      loop do
        profiles = ProfileStore.list
        return create if profiles.empty?

        last = ProfileStore.last_used
        choices = []
        choices << "#{USE_LAST} (#{last}: #{ProfileStore.describe(ProfileStore.load(last))})" if last
        choices += [USE_SAVED, CREATE, EDIT, DELETE]

        choice = ui.select("What do you want to do?", choices)
        case choice
        when /\A#{Regexp.escape(USE_LAST)}/ then return ProfileStore.load(last)
        when USE_SAVED then return ProfileStore.load(pick_profile(profiles))
        when CREATE then return create
        when EDIT
          name = pick_profile(profiles)
          return create(ProfileStore.load(name))
        when DELETE
          name = pick_profile(profiles)
          if ui.confirm("Delete profile '#{name}'?")
            ProfileStore.delete(name)
            ui.success("Deleted '#{name}'.")
          end
        end
      end
    end

    def create(defaults = {})
      ui.header(defaults.empty? ? "New build setup" : "Edit setup '#{defaults['name']}'")

      platforms = ask_platforms(defaults)
      environment = ask_environment(platforms, defaults["environment"])
      action = ui.select("What should this run do?", ordered(%w[build distribute], defaults["action"]))

      profile = { "platforms" => platforms, "environment" => environment, "action" => action }
      profile["android"] = android_options(environment, action, defaults.fetch("android", {})) if platforms.include?("android")
      profile["ios"] = ios_options(environment, action, defaults.fetch("ios", {})) if platforms.include?("ios")

      summary(profile)
      unless ui.confirm("Use this setup?")
        ui.important("Setup discarded.")
        return start
      end

      if ui.confirm("Save this setup for next time?")
        default_name = defaults["name"] || suggested_name(profile)
        name = ProfileStore.sanitize(ask("Profile name", default_name))
        name = default_name if name.empty?
        if ProfileStore.exists?(name) && name != defaults["name"] && !ui.confirm("Profile '#{name}' exists. Overwrite?")
          name = ProfileStore.sanitize(ask("New profile name", "#{name}-2"))
        end
        path = ProfileStore.save(name, profile)
        ui.success("Saved #{path}")
        profile["name"] = name
      end

      profile
    end

    def summary(profile)
      rows = [
        ["Platforms", Array(profile["platforms"]).join(", ")],
        ["Environment", profile["environment"]],
        ["Action", profile["action"]]
      ]
      if (android = profile["android"])
        rows << ["Android flavor", android["flavor"].to_s.empty? ? NONE : android["flavor"]]
        rows << ["Android build type", android["build_type"]]
        rows << ["Artifact", android.dig("artifact", "type")]
        rows << ["Gradle task", android["gradle_task"]]
        rows << ["Artifact glob", android.dig("artifact", "glob")]
        if profile["action"] == "distribute"
          rows << ["Firebase groups", android.dig("firebase", "groups").to_s]
          rows << ["Firebase testers", android.dig("firebase", "testers").to_s]
          rows << ["AI App Testing", android.dig("app_testing", "enabled") ? "on" : "off"]
        end
        rows << ["Release notes", android.dig("release_notes", "source")]
      end
      if (ios = profile["ios"])
        rows << ["iOS scheme", ios["scheme"]]
        if profile["action"] == "distribute" && ios["channel"] == "firebase"
          rows << ["iOS distribute to", "Firebase App Distribution (Ad Hoc)"]
          rows << ["Firebase groups", ios.dig("firebase", "groups").to_s]
          rows << ["Firebase testers", ios.dig("firebase", "testers").to_s]
        elsif profile["action"] == "distribute"
          rows << ["iOS distribute to", "TestFlight"]
          rows << ["TestFlight groups", Array(ios.dig("testflight", "groups")).join(", ")]
        else
          rows << ["iOS export method", ios["export_method"]]
        end
      end

      width = rows.map { |row| row[0].length }.max
      ui.header("Setup summary")
      rows.each { |label, value| ui.message("#{label.ljust(width)}  #{value}") }
    end

    private

    def android_options(environment, action, defaults)
      env_config = safe_env_config("android", environment)
      project_dir = DistributionConfig.android_settings.fetch("project_dir", "android")

      flavors = ProjectDetector.android_flavors(project_dir)
      flavor =
        if flavors.empty?
          ui.message("No product flavors detected — building without a flavor.")
          ""
        else
          default_flavor = defaults["flavor"] || env_config["flavor"] || flavors.find { |f| environment.start_with?(f.downcase) || f.downcase.start_with?(environment[0, 3]) }
          picked = ui.select("Android flavor:", ordered([NONE] + flavors, default_flavor))
          picked == NONE ? "" : picked
        end

      build_types = ProjectDetector.android_build_types(project_dir)
      build_type = ui.select("Build type:", ordered(build_types, defaults["build_type"] || env_config["build_type"] || "release"))

      current_type = defaults.dig("artifact", "type") || env_config.dig("artifact", "type")
      artifact = ui.select("Artifact:", ordered(%w[APK AAB], current_type.to_s.upcase))

      task = ProjectDetector.gradle_task(flavor: flavor, build_type: build_type, artifact: artifact)
      glob = ProjectDetector.artifact_glob(flavor: flavor, build_type: build_type, artifact: artifact, project_dir: project_dir)
      ui.message("Gradle task:   #{task}")
      ui.message("Artifact glob: #{glob}")
      unless ui.confirm("Use this Gradle task and glob?")
        task = ask("Gradle task", task)
        glob = ask("Artifact glob", glob)
      end

      options = {
        "flavor" => flavor,
        "build_type" => build_type,
        "gradle_task" => task,
        "artifact" => { "type" => artifact, "glob" => glob }
      }

      if action == "distribute"
        firebase = merge_defaults(env_config.fetch("firebase", {}), defaults.fetch("firebase", {}))
        available = split_list(visible(env_config.dig("firebase", "groups")))
        groups = pick_groups(available, split_list(defaults.dig("firebase", "groups")), environment)
        testers = ask("Firebase tester emails (comma separated, optional)", visible(firebase["testers"]))
        options["firebase"] = { "enabled" => true }
        options["firebase"]["groups"] = groups unless groups.empty?
        options["firebase"]["testers"] = testers unless testers.empty?

        testing_default = defaults.dig("app_testing", "enabled")
        testing_default = env_config.dig("app_testing", "enabled") if testing_default.nil?
        if artifact == "AAB"
          ui.important("Firebase AI App Testing needs an APK — it will be off for this AAB build.")
          ai = false
        else
          ai = ui.select("Firebase AI App Testing:", ordered(%w[on off], testing_default ? "on" : "off")) == "on"
        end
        options["app_testing"] = { "enabled" => ai }
      end

      options["release_notes"] = ask_release_notes(defaults["release_notes"] || env_config["release_notes"] || {})
      options
    end

    def ios_options(environment, action, defaults)
      env_config = safe_env_config("ios", environment)
      project_dir = DistributionConfig.ios_settings.fetch("project_dir", "ios")

      schemes = ProjectDetector.ios_schemes(project_dir)
      current_scheme = defaults["scheme"] || env_config["scheme"]
      scheme =
        if schemes.empty?
          ask("iOS scheme", current_scheme.to_s)
        else
          ui.select("iOS scheme:", ordered(schemes, current_scheme))
        end

      options = { "scheme" => scheme }

      if action == "distribute"
        channels = []
        channels << "firebase" if env_config.dig("firebase", "enabled")
        channels << "testflight"
        if channels.size == 1
          ui.message("Distribute to: TestFlight (Firebase is disabled for iOS #{environment})")
        end
        channel = channels.size == 1 ? channels.first : ui.select("Distribute to:", ordered(channels, defaults["channel"] || "firebase"))
        options["channel"] = channel

        if channel == "firebase"
          # Ad Hoc export; signs with the Apple ID in Xcode (no App Store Connect key needed locally).
          firebase = merge_defaults(env_config.fetch("firebase", {}), defaults.fetch("firebase", {}))
          available = split_list(visible(env_config.dig("firebase", "groups")))
          groups = pick_groups(available, split_list(defaults.dig("firebase", "groups")), environment, platform: "IOS")
          testers = ask("Firebase tester emails (comma separated, optional)", visible(firebase["testers"]))
          options["firebase"] = { "enabled" => true }
          options["firebase"]["groups"] = groups unless groups.empty?
          options["firebase"]["testers"] = testers unless testers.empty?
        else
          if ENV["APP_STORE_CONNECT_KEY_ID"].to_s.strip.empty?
            ui.important("TestFlight needs APP_STORE_CONNECT_KEY_ID / _ISSUER_ID / _KEY_FILE in .env — the run will stop until they are set.")
          end
          options["export_method"] = "app-store"
          current = Array(defaults.dig("testflight", "groups") || env_config.dig("testflight", "groups"))
          groups = ask("TestFlight groups (comma separated, blank = internal only)", current.join(", "))
          options["testflight"] = {
            "enabled" => true,
            "groups" => groups.split(",").map(&:strip).reject(&:empty?)
          }
        end
      else
        methods = %w[app-store ad-hoc development enterprise]
        options["export_method"] = ui.select("Export method:", ordered(methods, defaults["export_method"] || env_config.fetch("export_method", "app-store")))
      end

      options["release_notes"] = ask_release_notes(defaults["release_notes"] || env_config["release_notes"] || {})
      options
    end

    def ask_platforms(defaults)
      available = []
      available << "android" if DistributionConfig.android_enabled?
      available << "ios" if DistributionConfig.ios_enabled?
      if available.empty?
        raise DistributionConfig::ConfigurationError,
              "No platform is enabled in #{DistributionConfig.config_path}. Run `fastlane init_project` first."
      end
      if available.size == 1
        ui.message("Platform: #{available.first}")
        return available
      end

      current = Array(defaults["platforms"])
      current_label = current.sort == available.sort ? "both" : current.first
      choice = ui.select("Platform:", ordered(available + ["both"], current_label))
      choice == "both" ? available : [choice]
    end

    def ask_environment(platforms, current)
      lists = platforms.map do |platform|
        settings = platform == "android" ? DistributionConfig.android_settings : DistributionConfig.ios_settings
        settings.fetch("environments", {}).keys.map(&:to_s)
      end
      names = lists.reduce { |acc, list| acc & list } || []
      raise DistributionConfig::ConfigurationError, "No shared environments for #{platforms.join(' + ')}." if names.empty?

      ui.select("Environment:", ordered(names, current || DistributionConfig.default_environment))
    end

    def ask_release_notes(current)
      # "manual" text is exported as RELEASE_NOTES when the profile runs.
      source = ui.select("Release notes:", ordered(%w[git manual file], current.fetch("source", "git")))
      notes = { "enabled" => true, "source" => source }
      case source
      when "git"
        notes["commit_count"] = ask("Number of commits", current.fetch("commit_count", 10).to_s).to_i
      when "manual"
        notes["text"] = ask("Release notes text", current["text"].to_s)
      when "file"
        notes["file"] = ask("Release notes file path", current.fetch("file", "fastlane/release_notes.txt"))
      end
      notes
    end

    # Lets the user choose which of the environment's Firebase groups (from .env,
    # e.g. FIREBASE_ANDROID_DEV_GROUPS=tester,qa-team) this profile sends to.
    # Returns a comma-separated alias list; the profile distributes only to these.
    def pick_groups(available, current, environment, platform: "ANDROID")
      if available.empty?
        ui.important("No tester groups configured for #{environment} (set FIREBASE_#{platform}_<ENV>_GROUPS in .env, comma separated).")
        return split_list(ask("Firebase tester group aliases (comma separated, optional)", current.join(","))).join(",")
      end

      current = available if current.empty?
      ui.message("Tester groups available for #{environment}:")
      available.each_with_index do |name, index|
        mark = current.include?(name) ? "x" : " "
        ui.message("  #{index + 1}. [#{mark}] #{name}")
      end

      loop do
        raw = ask("Send to which groups? (numbers or aliases, comma separated, 'all')", current.join(","))
        tokens = split_list(raw)
        picked =
          if tokens.map(&:downcase) == ["all"]
            available
          else
            tokens.map { |t| t.match?(/\A\d+\z/) ? available[t.to_i - 1] : t }
          end
        if picked.empty? || picked.include?(nil)
          ui.error("Pick at least one group by number (1-#{available.size}) or alias.")
          next
        end

        unknown = picked - available
        if unknown.any? && !ui.confirm("#{unknown.join(', ')} not in your .env groups for #{environment}. Use anyway?")
          next
        end
        return picked.uniq.join(",")
      end
    end

    def split_list(value)
      value.to_s.split(",").map(&:strip).reject(&:empty?)
    end

    def pick_profile(profiles)
      labels = profiles.map { |name| "#{name}  (#{ProfileStore.describe(ProfileStore.load(name))})" }
      picked = ui.select("Profile:", labels)
      profiles[labels.index(picked)]
    end

    def suggested_name(profile)
      parts = [profile["environment"]]
      parts << profile.dig("android", "artifact", "type").to_s.downcase if profile["android"]
      parts << "ios" if profile["ios"] && !profile["android"]
      parts << "build" if profile["action"] == "build"
      ProfileStore.sanitize(parts.join("-"))
    end

    def safe_env_config(platform, environment)
      settings = platform == "android" ? DistributionConfig.android_settings : DistributionConfig.ios_settings
      value = settings.fetch("environments", {}).fetch(environment, {})
      value.is_a?(Hash) ? value : {}
    end

    def merge_defaults(base, override)
      (base.is_a?(Hash) ? base : {}).merge(override.is_a?(Hash) ? override : {})
    end

    # Hides unresolved "${VAR}" placeholders so they are not typed back as values.
    def visible(value)
      text = value.to_s
      text.include?("${") ? "" : text
    end

    def ordered(options, current)
      current = current.to_s
      match = options.find { |option| option.to_s.casecmp?(current) }
      match ? [match] + (options - [match]) : options
    end

    def ask(message, default = "")
      suffix = default.to_s.empty? ? "" : " [#{default}]"
      value = ui.input("#{message}#{suffix}:").to_s.strip
      value.empty? ? default.to_s : value
    end

    def ui
      FastlaneCore::UI
    end
  end
end
