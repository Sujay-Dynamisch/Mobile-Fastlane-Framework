# =============================================================================
# Firebase App Testing Agent - Test Result Parser
# =============================================================================
# frozen_string_literal: true

module TestResultParser
  module_function

  # Parses the outcome of a Firebase App Testing Agent run into structured metrics
  # for email notifications and reporting.
  #
  # @param error [StandardError, nil] Exception raised by Fastlane/Firebase test execution
  # @param test_case_ids [Array<String>] List of test case IDs configured for the run
  # @param devices [String] Configured test devices string
  # @param duration_seconds [Numeric] Execution duration in seconds
  # @param release_url [String, nil] URL pointing to the Firebase release / test report
  # @return [Hash] Structured test results
  def parse(error:, test_case_ids:, devices:, duration_seconds:, release_url:)
    total = [test_case_ids.size, 1].max
    duration_str = format_duration(duration_seconds)

    if error.nil?
      {
        status: "PASSED",
        total_tests: total,
        passed_tests: total,
        failed_tests: 0,
        failed_test_names: [],
        failed_devices: [],
        error_message: nil,
        error_reason: nil,
        duration: duration_str,
        duration_seconds: duration_seconds.to_f.round(1),
        firebase_url: release_url,
        test_case_ids: test_case_ids,
        devices: devices
      }
    else
      raw_message = error.respond_to?(:message) ? error.message.to_s : error.to_s
      extracted = extract_failure_meta(raw_message, test_case_ids)

      failed_count = extracted[:failed_count] || 1
      passed_count = [total - failed_count, 0].max

      {
        status: "FAILED",
        total_tests: total,
        passed_tests: passed_count,
        failed_tests: failed_count,
        failed_test_names: extracted[:failed_test_names],
        failed_devices: extracted[:failed_devices],
        error_message: raw_message,
        error_reason: extracted[:reason],
        duration: duration_str,
        duration_seconds: duration_seconds.to_f.round(1),
        firebase_url: release_url,
        test_case_ids: test_case_ids,
        devices: devices
      }
    end
  end

  def extract_failure_meta(message, test_case_ids)
    failed_devices = []
    failed_test_names = []
    reason = message

    # Pattern: "Automated test failed for <device>: <reason>."
    if message =~ /Automated test failed for (.*?):\s*(.*)/i
      failed_devices << Regexp.last_match(1).strip
      reason = Regexp.last_match(2).strip
    # Pattern: "Automated test inconclusive for <device>: <reason>."
    elsif message =~ /Automated test inconclusive for (.*?):\s*(.*)/i
      failed_devices << Regexp.last_match(1).strip
      reason = "Inconclusive: #{Regexp.last_match(2).strip}"
    # Pattern: "Test Case <name> not found"
    elsif message =~ /Test Case (.*?) not found/i
      test_id = Regexp.last_match(1).strip
      failed_test_names << test_id
      reason = "Test Case #{test_id} not found in Firebase project"
    elsif message =~ /took longer than expected/i
      reason = "Automated test execution timed out"
    end

    # Check if any known test case ID is mentioned in the error message
    test_case_ids.each do |tc_id|
      if message.include?(tc_id) && !failed_test_names.include?(tc_id)
        failed_test_names << tc_id
      end
    end

    {
      failed_devices: failed_devices.uniq,
      failed_test_names: failed_test_names.uniq,
      reason: reason,
      failed_count: [failed_test_names.size, 1].max
    }
  end

  def format_duration(seconds)
    return "0s" if seconds.nil? || seconds <= 0

    total_secs = seconds.to_i
    minutes = total_secs / 60
    remaining_secs = total_secs % 60

    if minutes > 0
      "#{minutes}m #{remaining_secs}s"
    else
      "#{remaining_secs}s"
    end
  end
end
