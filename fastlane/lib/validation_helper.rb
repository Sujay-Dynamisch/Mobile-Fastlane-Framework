# frozen_string_literal: true

module ValidationHelper
  module_function

  def required!(value, path)
    unresolved = value.is_a?(String) && value.match?(/\$\{[A-Z][A-Z0-9_]*\}/)
    blank = value.nil? || (value.respond_to?(:empty?) && value.empty?) || (value.is_a?(String) && value.strip.empty?)

    return value unless blank || unresolved

    raise DistributionConfig::MissingConfigurationError, "Missing required configuration: #{path}"
  end

  def file!(path, description)
    resolved = DistributionConfig.absolute_path(path.to_s)
    raise DistributionConfig::MissingConfigurationError, "#{description} does not exist: #{resolved}" unless File.exist?(resolved)
    resolved
  end

  def gradle_task!(project_dir, task)
    wrapper_name = Gem.win_platform? ? "gradlew.bat" : "gradlew"
    wrapper = file!(File.join(project_dir, wrapper_name), "Android Gradle wrapper")

    output = Dir.chdir(project_dir) do
      `"#{wrapper}" tasks --all --console=plain 2>&1`
    end

    return true if output.to_s.include?(task.to_s)

    raise DistributionConfig::ConfigurationError, <<~ERROR
      Gradle task '#{task}' was not found.

      Project:
      #{project_dir}

      Check fastlane/config/environments.yml and verify the configured
      flavor/build type/task exists in the target Android project.
    ERROR
  end

  def branch!(allowed_branches)
    return if allowed_branches.nil? || allowed_branches.empty?

    branch = current_branch
    return if allowed_branches.any? { |allowed| branch_match?(branch, allowed) }

    raise "Current Git branch '#{branch}' is not allowed. Allowed: #{allowed_branches.join(', ')}"
  end

  def production_guard!(config, ci: false)
    safety = config.fetch("safety", {})
    return unless safety.is_a?(Hash)

    require_ci = safety.fetch(
      "require_ci",
      DistributionConfig.security.fetch("production_requires_ci", false)
    )

    if require_ci && !ci
      raise "Production distribution requires CI."
    end

    allowed_branches = safety.fetch("allowed_branches", [])
    branch!(allowed_branches)

    if safety.fetch("require_confirmation", false) && !ci
      confirmed = UI.confirm("You are about to distribute a PRODUCTION build. Continue?")
      raise "Production distribution cancelled." unless confirmed
    end
  end

  def current_branch
    github_branch = ENV["GITHUB_REF_NAME"].to_s.strip
    return github_branch unless github_branch.empty?

    branch = `git branch --show-current 2>/dev/null`.to_s.strip
    return branch unless branch.empty?

    "DETACHED_HEAD"
  end

  def branch_match?(branch, pattern)
    expected = pattern.to_s.strip
    return branch == expected unless expected.include?("*")

    regex = Regexp.new("\\A" + Regexp.escape(expected).gsub("\\*", ".*") + "\\z")
    branch.match?(regex)
  end
end
