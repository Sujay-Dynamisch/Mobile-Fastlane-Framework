# frozen_string_literal: true

require "fileutils"

module ArtifactHelper
  module_function

  SUPPORTED_TYPES = %w[APK AAB].freeze

  def find(root:, glob:, type:)
    normalized_type = type.to_s.upcase
    validate_type!(normalized_type)

    pattern = File.join(root, glob)
    files = Dir.glob(pattern).select { |file| File.file?(file) }

    files = files.select { |file| File.extname(file).delete(".").upcase == normalized_type }

    if files.empty?
      raise <<~ERROR
        No #{normalized_type} artifact found.

        Pattern:
        #{pattern}

        Verify the Gradle task and artifact.glob in:
        fastlane/config/environments.yml
      ERROR
    end

    files.max_by { |file| File.mtime(file) }
  end

  def validate_type!(type)
    return if SUPPORTED_TYPES.include?(type)

    raise "Unsupported Android artifact type '#{type}'. Supported: APK, AAB."
  end

  def stage(root:, source:, project:, environment:, version:, build:, commit:)
    naming = DistributionConfig.artifact_settings.fetch("naming", {})
    return source unless naming.fetch("enabled", false)

    pattern = naming.fetch(
      "pattern",
      "{project}-{environment}-v{version}-{build}.{extension}"
    )

    extension = File.extname(source).delete(".")

    filename = pattern.dup
    replacements = {
      "{project}" => sanitize(project),
      "{environment}" => sanitize(environment),
      "{version}" => sanitize(version),
      "{build}" => sanitize(build),
      "{commit}" => sanitize(commit),
      "{platform}" => "android",
      "{extension}" => extension
    }

    replacements.each do |token, value|
      filename.gsub!(token, value)
    end

    output_dir = File.join(root, "dist")
    FileUtils.mkdir_p(output_dir)

    destination = File.join(output_dir, filename)
    FileUtils.cp(source, destination)

    destination
  end

  def sanitize(value)
    value.to_s.gsub(/[^A-Za-z0-9._-]+/, "-")
  end
end
