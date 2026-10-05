# frozen_string_literal: true

module ReleaseNotes
  module_function

  def generate(environment:, config: {})
    return "Automated #{environment} build." unless config.fetch("enabled", true)

    if !ENV["RELEASE_NOTES_FILE"].to_s.strip.empty?
      return file_notes(config)
    elsif !ENV["RELEASE_NOTES"].to_s.strip.empty?
      return manual_notes
    end

    source = config.fetch("source", "git").to_s.downcase

    case source
    when "manual"
      manual_notes
    when "file"
      file_notes(config)
    when "git"
      git_notes(environment, config)
    else
      raise "Unsupported release notes source '#{source}'. Supported: git, manual, file."
    end
  end

  def manual_notes
    notes = ENV["RELEASE_NOTES"].to_s.strip
    notes.empty? ? "Automated build." : notes
  end

  def file_notes(config)
    path = ENV["RELEASE_NOTES_FILE"].to_s.strip
    path = config["file"] if path.empty?

    raise "Release notes file is not configured." if path.to_s.strip.empty?

    absolute = DistributionConfig.absolute_path(path)
    raise "Release notes file does not exist: #{absolute}" unless File.exist?(absolute)

    notes = File.read(absolute).strip
    notes.empty? ? "Automated build." : notes
  end

  def git_notes(environment, config)
    count = config.fetch("commit_count", 10).to_i
    count = 1 if count < 1

    commits = `git log -#{count} --pretty=format:%s 2>/dev/null`.to_s.strip

    return "Automated #{environment} build." if commits.empty?

    prefix = config.fetch("prefix", "Automated Mobile Distribution").to_s.strip
    lines = commits.lines.map { |line| "- #{line.strip}" }

    [
      prefix,
      "Environment: #{environment.upcase}",
      "",
      "Changes:",
      lines.join
    ].join("\n").strip
  rescue StandardError
    "Automated #{environment} build."
  end
end
