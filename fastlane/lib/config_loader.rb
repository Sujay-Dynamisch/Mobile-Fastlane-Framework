# frozen_string_literal: true

require "yaml"
require "json"

begin
  require "dotenv"
  Dotenv.load(File.expand_path("../../.env", __dir__))
rescue LoadError
end

module DistributionConfig
  ROOT = File.expand_path("../..", __dir__).freeze
  CONFIG_PATH = (
    [
      File.join(ROOT, "fastlane", "config", "environments.yaml"),
      File.join(ROOT, "fastlane", "config", "environments.yml")
    ].find { |path| File.exist?(path) } ||
      File.join(ROOT, "fastlane", "config", "environments.yaml")
  ).freeze

  TESTING_CONFIG_PATH = (
    [
      File.join(ROOT, "fastlane", "config", "testing.yaml"),
      File.join(ROOT, "fastlane", "config", "testing.yml")
    ].find { |path| File.exist?(path) } ||
      File.join(ROOT, "fastlane", "config", "testing.yml")
  ).freeze

  class ConfigurationError < StandardError; end
  class EnvironmentNotFoundError < ConfigurationError; end
  class PlatformNotEnabledError < ConfigurationError; end
  class MissingConfigurationError < ConfigurationError; end

  class << self
    # Per-run overrides set by the interactive setup / saved profiles.
    # Shape: { "android" => { ...env keys... }, "ios" => { ... } }
    attr_writer :runtime_overrides

    def runtime_overrides
      @runtime_overrides ||= {}
    end

    def all
      @all ||= load_configuration
    end

    def testing
      @testing ||= load_testing_configuration
    end

    def project
      raw = all.fetch("project", {})
      detected_name = detect_app_name

      name = raw["name"]
      name = ENV["APP_NAME"] if unresolved_or_blank?(name)
      name = detected_name if unresolved_or_blank?(name)

      identifier = raw["identifier"]
      identifier = ENV["APP_IDENTIFIER"] if unresolved_or_blank?(identifier)
      identifier = (detect_package_name || detected_name.to_s.downcase.gsub(/[^a-z0-9_-]/, "")) if unresolved_or_blank?(identifier)

      organization = raw["organization"]
      organization = ENV["APP_ORGANIZATION"] if unresolved_or_blank?(organization)
      organization = "Default" if unresolved_or_blank?(organization)

      default_env = raw["default_environment"]
      default_env = ENV["APP_ENV"] if unresolved_or_blank?(default_env)
      default_env = "development" if unresolved_or_blank?(default_env)

      {
        "name" => name,
        "identifier" => identifier,
        "organization" => organization,
        "default_environment" => normalize_environment(default_env)
      }.merge(raw.reject { |_, v| unresolved_or_blank?(v) })
    end

    def android_settings
      all.fetch("android", {})
    end

    def ios_settings
      all.fetch("ios", {})
    end

    def ci
      all.fetch("ci", {})
    end

    def security
      all.fetch("security", {})
    end

    def notifications
      all.fetch("notifications", {})
    end

    def release_notes
      all.fetch("release_notes", {})
    end

    def artifact_settings
      all.fetch("artifact", {})
    end

    def android(environment)
      ensure_platform_enabled!("android")
      config = fetch_environment!(android_settings.fetch("environments", {}), environment, "Android")
      config = merge_hashes(config, runtime_overrides.fetch("android", {}))

      firebase = config["firebase"]
      if firebase.is_a?(Hash) && firebase.fetch("enabled", false) == true
        if unresolved_or_blank?(firebase["app_id"])
          detected = detect_firebase_app_id
          firebase["app_id"] = detected if detected
        end
      end

      config
    end

    def ios(environment)
      ensure_platform_enabled!("ios")
      config = fetch_environment!(ios_settings.fetch("environments", {}), environment, "iOS")
      config = merge_hashes(config, runtime_overrides.fetch("ios", {}))

      config["workspace"] = detect_ios_workspace if unresolved_or_blank?(config["workspace"])
      config["scheme"] = project["name"] if unresolved_or_blank?(config["scheme"])
      config["bundle_identifier"] = (detect_package_name || "com.#{project['name'].downcase}") if unresolved_or_blank?(config["bundle_identifier"])

      config
    end

    def android_enabled?
      android_settings.fetch("enabled", false) == true
    end

    def ios_enabled?
      ios_settings.fetch("enabled", false) == true
    end

    def android_uses_flavors?
      android_settings.fetch("use_flavors", false) == true
    end

    def android_project_dir
      absolute_path(android_settings.fetch("project_dir", "android"))
    end

    def ios_project_dir
      absolute_path(ios_settings.fetch("project_dir", "ios"))
    end

    def ios_signing
      ios_settings.fetch("signing", {})
    end

    def default_environment
      configured = ENV["APP_ENV"].to_s.strip
      return normalize_environment(configured) unless configured.empty?

      normalize_environment(project.fetch("default_environment", "development"))
    end

    def effective_notifications(platform_config)
      merge_hashes(notifications, platform_config.fetch("notifications", {}))
    end

    def effective_release_notes(environment_config)
      merge_hashes(release_notes, environment_config.fetch("release_notes", {}))
    end

    # Resolves AI app testing configuration by merging global testing.yml,
    # root testing flags, and environment-level overrides.
    def effective_app_testing(environment_config)
      global_testing = testing.fetch("app_testing", {})
      root_testing = all.fetch("app_testing", {})
      env_testing = environment_config.fetch("app_testing", {})

      merged = merge_hashes(global_testing, root_testing)
      merged = merge_hashes(merged, env_testing)

      merged["enabled"] = merged.fetch("enabled", false) == true
      merged["blocking"] = merged.fetch("blocking", true) != false
      merged
    end

    def validate!
      config = all
      raise ConfigurationError, "Configuration root must be a YAML object." unless config.is_a?(Hash)

      validate_project!
      validate_android_section!
      validate_ios_section!
      validate_hash_section!("notifications", notifications)
      true
    end

    def validate_android_environment!(environment)
      config = android(environment)
      env_name = normalize_environment(environment)

      require_value!(config["gradle_task"], "android.#{env_name}.gradle_task")

      artifact = config.fetch("artifact", {})
      raise ConfigurationError, "android.#{env_name}.artifact must be an object." unless artifact.is_a?(Hash)

      require_value!(artifact["type"], "android.#{env_name}.artifact.type")
      require_value!(artifact["glob"], "android.#{env_name}.artifact.glob")

      type = artifact["type"].to_s.upcase
      unless %w[APK AAB].include?(type)
        raise ConfigurationError, "android.#{env_name}.artifact.type must be APK or AAB."
      end

      firebase = config.fetch("firebase", {})
      if firebase.is_a?(Hash) && firebase.fetch("enabled", false) == true
        require_value!(firebase["app_id"], "android.#{env_name}.firebase.app_id")

        groups = firebase["groups"]
        testers = firebase["testers"]
        if unresolved_or_blank?(groups) && unresolved_or_blank?(testers)
          raise ConfigurationError,
                "android.#{env_name}.firebase requires tester groups or tester emails."
        end
      end

      true
    end

    def validate_ios_environment!(environment)
      config = ios(environment)
      env_name = normalize_environment(environment)

      require_value!(config["workspace"], "ios.#{env_name}.workspace")
      require_value!(config["scheme"], "ios.#{env_name}.scheme")
      require_value!(config["bundle_identifier"], "ios.#{env_name}.bundle_identifier")
      true
    end

    def absolute_path(path)
      value = path.to_s
      return value if value.empty? || absolute_filesystem_path?(value)

      File.expand_path(value, ROOT)
    end

    def root
      ROOT
    end

    def config_path
      CONFIG_PATH
    end

    def config_exists?
      File.exist?(CONFIG_PATH)
    end

    def detected_app_name
      detect_app_name
    end

    def detected_package_name
      detect_package_name
    end

    def detected_ios_workspace
      detect_ios_workspace
    end

    private

    def load_configuration
      raise ConfigurationError, "Configuration file not found: #{CONFIG_PATH}" unless File.exist?(CONFIG_PATH)

      begin
        data = YAML.safe_load(
          File.read(CONFIG_PATH),
          permitted_classes: [],
          permitted_symbols: [],
          aliases: true
        )
      rescue Psych::SyntaxError => e
        raise ConfigurationError, "Invalid YAML syntax in #{CONFIG_PATH}: #{e.message}"
      end

      raise ConfigurationError, "Configuration root must be a YAML object." unless data.is_a?(Hash)

      expand_environment_variables(data)
    end

    def load_testing_configuration
      return {} unless File.exist?(TESTING_CONFIG_PATH)

      begin
        data = YAML.safe_load(
          File.read(TESTING_CONFIG_PATH),
          permitted_classes: [],
          permitted_symbols: [],
          aliases: true
        )
      rescue Psych::SyntaxError => e
        warn "[DistributionConfig] Warning: Invalid YAML in #{TESTING_CONFIG_PATH}: #{e.message}"
        return {}
      end

      return {} unless data.is_a?(Hash)

      expand_environment_variables(data)
    end

    def expand_environment_variables(value)
      case value
      when Hash
        value.each_with_object({}) do |(key, item), result|
          result[key] = expand_environment_variables(item)
        end
      when Array
        value.map { |item| expand_environment_variables(item) }
      when String
        value.gsub(/\$\{([A-Z][A-Z0-9_]*)\}/) do
          name = Regexp.last_match(1)
          ENV.fetch(name, "${#{name}}")
        end
      else
        value
      end
    end

    def ensure_platform_enabled!(platform)
      enabled = platform == "android" ? android_enabled? : ios_enabled?
      return if enabled

      raise PlatformNotEnabledError,
            "#{platform.capitalize} automation is disabled in fastlane/config/environments.yml."
    end

    def fetch_environment!(environments, environment, platform_name)
      raise ConfigurationError, "#{platform_name} environments must be an object." unless environments.is_a?(Hash)

      key = normalize_environment(environment)
      raise EnvironmentNotFoundError, "#{platform_name} environment cannot be empty." if key.empty?

      unless environments.key?(key)
        available = environments.keys.map(&:to_s).join(", ")
        raise EnvironmentNotFoundError,
              "Unknown #{platform_name} environment '#{key}'. Available: #{available}"
      end

      value = environments.fetch(key)
      raise ConfigurationError,
            "#{platform_name} environment '#{key}' must be an object." unless value.is_a?(Hash)

      value
    end

    def validate_project!
      config = project
      raise ConfigurationError, "project must be an object." unless config.is_a?(Hash)
      require_value!(config["name"], "project.name")
    end

    def validate_android_section!
      config = android_settings
      raise ConfigurationError, "android must be an object." unless config.is_a?(Hash)
      return unless config.fetch("enabled", false) == true

      require_value!(config["project_dir"], "android.project_dir")
      environments = config.fetch("environments", {})
      unless environments.is_a?(Hash) && !environments.empty?
        raise ConfigurationError, "Android is enabled but no environments are configured."
      end
    end

    def validate_ios_section!
      config = ios_settings
      raise ConfigurationError, "ios must be an object." unless config.is_a?(Hash)
      return unless config.fetch("enabled", false) == true

      require_value!(config["project_dir"], "ios.project_dir")
      environments = config.fetch("environments", {})
      unless environments.is_a?(Hash) && !environments.empty?
        raise ConfigurationError, "iOS is enabled but no environments are configured."
      end
    end

    def validate_hash_section!(name, value)
      raise ConfigurationError, "#{name} must be an object." unless value.is_a?(Hash)
    end

    def require_value!(value, location)
      raise MissingConfigurationError, "Missing required configuration: #{location}" if unresolved_or_blank?(value)
    end

    def unresolved_or_blank?(value)
      return true if value.nil?
      return true if value.respond_to?(:empty?) && value.empty?
      return true if value.is_a?(String) && value.strip.empty?
      return true if value.is_a?(String) && value.match?(/\$\{[A-Z][A-Z0-9_]*\}/)

      false
    end

    def normalize_environment(environment)
      environment.to_s.strip.downcase
    end

    def absolute_filesystem_path?(path)
      path.start_with?("/") ||
        path.start_with?("\\\\") ||
        path.match?(/\A[A-Za-z]:[\\\/]/)
    end

    def merge_hashes(base, override)
      return override unless base.is_a?(Hash)
      return base unless override.is_a?(Hash)

      result = base.each_with_object({}) { |(key, value), hash| hash[key] = value }

      override.each do |key, value|
        result[key] =
          if result[key].is_a?(Hash) && value.is_a?(Hash)
            merge_hashes(result[key], value)
          else
            value
          end
      end

      result
    end

    def detect_app_name
      app_json = File.join(ROOT, "app.json")
      if File.exist?(app_json)
        begin
          data = JSON.parse(File.read(app_json))
          # React Native CLI: {"name", "displayName"}; Expo: {"expo": {"name"}}
          name = data["displayName"] || data["name"] || data.dig("expo", "name")
          return name.to_s.strip if name && !name.to_s.strip.empty?
        rescue StandardError
        end
      end

      strings_xml = File.join(ROOT, "android", "app", "src", "main", "res", "values", "strings.xml")
      if File.exist?(strings_xml)
        begin
          content = File.read(strings_xml)
          if content =~ /<string name="app_name">([^<]+)<\/string>/
            return Regexp.last_match(1).strip
          end
        rescue StandardError
        end
      end

      package_json = File.join(ROOT, "package.json")
      if File.exist?(package_json)
        begin
          data = JSON.parse(File.read(package_json))
          name = data["name"]
          return name.to_s.strip if name && !name.to_s.strip.empty?
        rescue StandardError
        end
      end

      File.basename(ROOT)
    end

    def detect_package_name
      gs_path = File.join(ROOT, "android", "app", "google-services.json")
      if File.exist?(gs_path)
        begin
          data = JSON.parse(File.read(gs_path))
          pkg = data.dig("client", 0, "client_info", "android_client_info", "package_name")
          return pkg.to_s.strip if pkg && !pkg.to_s.strip.empty?
        rescue StandardError
        end
      end

      # Groovy (`applicationId "x"`) and Kotlin DSL (`applicationId = "x"` in build.gradle.kts).
      gradle_path = %w[build.gradle build.gradle.kts]
                    .map { |name| File.join(ROOT, "android", "app", name) }
                    .find { |path| File.exist?(path) }
      if gradle_path
        begin
          content = File.read(gradle_path)
          if content =~ /(?:applicationId|namespace)\s*=?\s*["']([^"']+)["']/
            return Regexp.last_match(1).strip
          end
        rescue StandardError
        end
      end

      package_json = File.join(ROOT, "package.json")
      if File.exist?(package_json)
        begin
          data = JSON.parse(File.read(package_json))
          name = data["name"].to_s.strip
          return name if name.include?(".")
        rescue StandardError
        end
      end

      nil
    end

    def detect_firebase_app_id
      gs_path = File.join(ROOT, "android", "app", "google-services.json")
      return nil unless File.exist?(gs_path)

      data = JSON.parse(File.read(gs_path))
      app_id = data.dig("client", 0, "client_info", "mobilesdk_app_id")
      return app_id.to_s.strip if app_id && !app_id.to_s.strip.empty?

      nil
    rescue StandardError
      nil
    end

    def detect_ios_workspace
      workspaces = Dir.glob(File.join(ROOT, "ios", "*.xcworkspace"))
      return "ios/#{File.basename(workspaces.first)}" unless workspaces.empty?

      projects = Dir.glob(File.join(ROOT, "ios", "*.xcodeproj"))
      return "ios/#{File.basename(projects.first).sub(/\.xcodeproj\z/, '.xcworkspace')}" unless projects.empty?

      "ios/#{detect_app_name}.xcworkspace"
    end
  end
end
