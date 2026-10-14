# frozen_string_literal: true

require "yaml"
require "fileutils"
require_relative "config_loader"

# Saved setup profiles (committed) in fastlane/config/profiles/*.yml.
# The "last used" pointer lives in fastlane/.setup_state.yml (gitignored).
module ProfileStore
  PROFILES_DIR = File.join(DistributionConfig.root, "fastlane", "config", "profiles").freeze
  STATE_PATH = File.join(DistributionConfig.root, "fastlane", ".setup_state.yml").freeze

  class << self
    def list
      Dir.glob(File.join(PROFILES_DIR, "*.yml")).map { |path| File.basename(path, ".yml") }.sort
    end

    def exists?(name)
      File.exist?(path_for(name))
    end

    def load(name)
      path = path_for(name)
      raise DistributionConfig::ConfigurationError, "Profile '#{name}' not found (#{path})." unless File.exist?(path)

      data = YAML.safe_load(File.read(path), permitted_classes: [], aliases: true)
      raise DistributionConfig::ConfigurationError, "Profile '#{name}' must be a YAML object." unless data.is_a?(Hash)

      data.merge("name" => sanitize(name))
    end

    def save(name, profile)
      FileUtils.mkdir_p(PROFILES_DIR)
      path = path_for(name)
      File.write(path, "# Saved by `fastlane setup`. Run with: fastlane run_profile name:#{sanitize(name)}\n" +
                       profile.merge("name" => sanitize(name)).to_yaml.sub(/\A---\n/, ""))
      path
    end

    def delete(name)
      path = path_for(name)
      File.delete(path) if File.exist?(path)
      self.last_used = nil if last_used == sanitize(name)
    end

    def last_used
      return nil unless File.exist?(STATE_PATH)

      name = (YAML.safe_load(File.read(STATE_PATH)) || {})["last_profile"]
      name && exists?(name) ? name : nil
    rescue StandardError
      nil
    end

    def last_used=(name)
      File.write(STATE_PATH, { "last_profile" => name }.to_yaml)
    end

    # One-line description, e.g. "android · staging · AAB · distribute".
    def describe(profile)
      parts = [Array(profile["platforms"]).join("+"), profile["environment"]]
      flavor = profile.dig("android", "flavor").to_s
      parts << flavor unless flavor.empty?
      type = profile.dig("android", "artifact", "type")
      parts << type if type
      parts << profile.dig("ios", "channel") if profile.dig("ios", "channel")
      parts << profile.fetch("action", "build")
      parts.compact.join(" · ")
    end

    def sanitize(name)
      name.to_s.strip.downcase.gsub(/[^a-z0-9_-]+/, "-").gsub(/\A-+|-+\z/, "")
    end

    private

    def path_for(name)
      File.join(PROFILES_DIR, "#{sanitize(name)}.yml")
    end
  end
end
