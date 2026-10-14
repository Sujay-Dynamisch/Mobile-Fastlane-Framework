# frozen_string_literal: true

require_relative "config_loader"

# Detects Android flavors / build types and iOS schemes from the native
# projects, and derives Gradle task names and artifact globs from them.
module ProjectDetector
  DEFAULT_BUILD_TYPES = %w[debug release].freeze

  class << self
    def android_gradle_file(project_dir = "android")
      base = File.join(DistributionConfig.absolute_path(project_dir), "app")
      [File.join(base, "build.gradle"), File.join(base, "build.gradle.kts")].find { |path| File.exist?(path) }
    end

    def android_flavors(project_dir = "android")
      block_names(android_gradle_content(project_dir), "productFlavors")
    end

    def android_build_types(project_dir = "android")
      names = block_names(android_gradle_content(project_dir), "buildTypes")
      (DEFAULT_BUILD_TYPES + names).uniq
    end

    # assemble|bundle + Flavor + BuildType, e.g. bundleStagingRelease.
    def gradle_task(flavor:, build_type:, artifact:)
      prefix = artifact.to_s.upcase == "AAB" ? "bundle" : "assemble"
      "#{prefix}#{capitalize(flavor)}#{capitalize(build_type)}"
    end

    def artifact_glob(flavor:, build_type:, artifact:, project_dir: "android")
      outputs = "#{project_dir.to_s.chomp('/')}/app/build/outputs"
      flavor = flavor.to_s.strip
      type = build_type.to_s.strip

      if artifact.to_s.upcase == "AAB"
        variant = flavor.empty? ? type : "#{flavor}#{capitalize(type)}"
        "#{outputs}/bundle/#{variant}/*.aab"
      else
        dir = flavor.empty? ? type : "#{flavor}/#{type}"
        "#{outputs}/apk/#{dir}/*.apk"
      end
    end

    def ios_schemes(project_dir = "ios")
      dir = DistributionConfig.absolute_path(project_dir)
      patterns = [
        File.join(dir, "*.xcodeproj", "xcshareddata", "xcschemes", "*.xcscheme"),
        File.join(dir, "*.xcworkspace", "xcshareddata", "xcschemes", "*.xcscheme")
      ]
      patterns.flat_map { |pattern| Dir.glob(pattern) }
              .map { |path| File.basename(path, ".xcscheme") }
              .uniq
              .sort
    end

    def android_present?(project_dir = "android")
      !android_gradle_file(project_dir).nil?
    end

    def ios_present?(project_dir = "ios")
      dir = DistributionConfig.absolute_path(project_dir)
      !Dir.glob(File.join(dir, "*.{xcodeproj,xcworkspace}")).empty?
    end

    private

    def android_gradle_content(project_dir)
      path = android_gradle_file(project_dir)
      path ? File.read(path) : ""
    rescue StandardError
      ""
    end

    # Returns the names of the direct children of `name { ... }`.
    # Supports Groovy (`staging {`) and Kotlin DSL (`create("staging") {`).
    def block_names(content, name)
      body = block_body(content, name)
      return [] if body.nil?

      names = []
      depth = 0
      line_start = 0
      body.each_char.with_index do |char, index|
        if char == "{"
          if depth.zero?
            header = body[line_start...index].to_s.split("\n").last.to_s.strip
            child = header[/(?:create|register|getByName|maybeCreate)\(\s*["']([^"']+)["']\s*\)/, 1] ||
                    header[/\A([A-Za-z_][A-Za-z0-9_]*)\z/, 1]
            names << child if child
          end
          depth += 1
        elsif char == "}"
          depth -= 1
          line_start = index + 1 if depth.zero?
        elsif char == "\n" && depth.zero?
          line_start = index + 1
        end
      end
      names.uniq
    end

    def block_body(content, name)
      match = content.match(/\b#{Regexp.escape(name)}\s*\{/)
      return nil unless match

      start = match.end(0)
      depth = 1
      index = start
      while index < content.length && depth.positive?
        depth += 1 if content[index] == "{"
        depth -= 1 if content[index] == "}"
        index += 1
      end
      content[start...(index - 1)]
    end

    def capitalize(value)
      text = value.to_s.strip
      return "" if text.empty?

      text[0].upcase + text[1..]
    end
  end
end
