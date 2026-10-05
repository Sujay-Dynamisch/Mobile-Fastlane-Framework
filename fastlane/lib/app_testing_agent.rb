# =============================================================================
# Firebase App Testing Agent Automation
# =============================================================================
# frozen_string_literal: true

require "yaml"
require_relative "config_loader"

module AppTestingAgent
  ROOT = File.expand_path("../..", __dir__).freeze
  TEST_CASE_IDS_FILE = File.join(ROOT, "fastlane", "config", "test_case_ids.yml").freeze

  DEFAULT_DEVICES = [
    { "model" => "shiba", "version" => "34", "locale" => "en", "orientation" => "portrait" }
  ].freeze

  class << self
    # Check if app testing is enabled for this environment
    def enabled?(environment_config)
      app_testing = DistributionConfig.effective_app_testing(environment_config)
      app_testing.fetch("enabled", false) == true
    end

    def blocking?(environment_config)
      DistributionConfig.effective_app_testing(environment_config).fetch("blocking", true)
    end

    # Read all Firebase Test Case IDs from fastlane/config/test_case_ids.yml
    # Every listed test case ID will automatically run on upload.
    # @return [Array<String>]
    def test_case_ids
      @test_case_ids ||= load_test_case_ids
    end

    # Reload test case IDs from disk
    def reload!
      @test_case_ids = nil
      true
    end

    # Return test devices formatted for the firebase_app_distribution plugin
    # Example: "model=shiba,version=34,locale=en,orientation=portrait;model=oriole,version=33,locale=en,orientation=portrait"
    # @return [String]
    def test_devices(environment_config = {})
      devices = configured_devices(environment_config)
      format_devices(devices)
    end

    # Attach test_devices, test_case_ids, and test_non_blocking: false directly into
    # the existing firebase_app_distribution options hash
    def apply_to_firebase_options(options, environment_config)
      return options unless enabled?(environment_config)

      ids = test_case_ids
      devices_str = test_devices(environment_config)

      options[:test_devices] = devices_str unless devices_str.empty?
      options[:test_case_ids] = ids.join(",") unless ids.empty?
      # blocking: true (default) waits for results so failures fail the lane.
      options[:test_non_blocking] = !blocking?(environment_config)

      # Optional login credentials the agent uses when a test needs to sign in.
      username = ENV["FIREBASE_TEST_USERNAME"].to_s.strip
      password = ENV["FIREBASE_TEST_PASSWORD"].to_s
      unless username.empty? || password.empty?
        options[:test_username] = username
        options[:test_password] = password
      end

      options
    end

    private

    def load_test_case_ids
      return [] unless File.exist?(TEST_CASE_IDS_FILE)

      data = YAML.safe_load(File.read(TEST_CASE_IDS_FILE), permitted_classes: [], permitted_symbols: [], aliases: true)
      return [] unless data.is_a?(Hash)

      raw = data["test_case_ids"]
      case raw
      when Array
        raw.map(&:to_s).map(&:strip).reject(&:empty?)
      when String
        raw.split(/[,\n]/).map(&:strip).reject(&:empty?)
      else
        []
      end
    rescue StandardError => e
      warn "[AppTestingAgent] Warning: Failed to parse #{TEST_CASE_IDS_FILE}: #{e.message}"
      []
    end

    def configured_devices(environment_config)
      # 1. Environment-specific override
      env_devices = environment_config.dig("app_testing", "test_devices")
      return env_devices if env_devices.is_a?(Array) && !env_devices.empty?

      # 2. Global testing.yml devices
      testing_cfg = DistributionConfig.testing
      testing_devices = testing_cfg["test_devices"]
      return testing_devices if testing_devices.is_a?(Array) && !testing_devices.empty?

      DEFAULT_DEVICES
    end

    def format_devices(devices)
      return "" unless devices.is_a?(Array)

      device_strings = devices.filter_map do |dev|
        case dev
        when Hash
          model = dev["model"] || dev[:model]
          version = dev["version"] || dev[:version]
          locale = dev["locale"] || dev[:locale] || "en"
          orientation = dev["orientation"] || dev[:orientation] || "portrait"
          next if model.to_s.strip.empty? || version.to_s.strip.empty?

          "model=#{model},version=#{version},locale=#{locale},orientation=#{orientation}"
        when String
          dev.strip.empty? ? nil : dev.strip
        else
          nil
        end
      end

      device_strings.join(";")
    end
  end
end
