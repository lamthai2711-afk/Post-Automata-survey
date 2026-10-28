/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT: POST-SESSION SHEET BACKEND (SHEET 2 - 71 COLUMNS)
 * Purpose: Receives and processes Post-Session Assessment data:
 *          - Participant Identity & Secondary Matching (Neptun, Name)
 *          - Cognitive Load Dimensions (IL, EL, GL) with auto-mean computation
 *          - Intrinsic Motivation Inventory (IMI) with auto-mean computation
 *          - Post-Test Diagnostic MCQs (Q1 to Q15) with automatic item scoring (0-28)
 *          - Instructional Usability and Audit Metadata
 * ==============================================================================
 */

var POST_SESSION_SCHEMA = [
  // 1. Participant Identity & Secondary Matching (Neptun, Name)
  { key: "timestamp",                    title: "Timestamp" },
  { key: "participant_id",               title: "Participant ID" },
  { key: "neptun_code",                  title: "Neptun Code" },
  { key: "student_name",                 title: "Student Full Name" },
  { key: "teacher_official_grade",       title: "Teacher Official Course Grade (External Evidence)" },
  { key: "ip_address",                   title: "IP Address" },

  // 2. Cognitive Load Scales (0 to 10)
  { key: "il1",                          title: "IL1 (Topic Complexity)" },
  { key: "il2",                          title: "IL2 (Rule Coordination)" },
  { key: "il3",                          title: "IL3 (Working Memory Demand)" },
  { key: "mean_il",                      title: "Mean Intrinsic Load (IL)" },
  { key: "el1",                          title: "EL1 (Presentation Complication)" },
  { key: "el2",                          title: "EL2 (Diagram Distraction)" },
  { key: "el3",                          title: "EL3 (Navigation Friction)" },
  { key: "mean_el",                      title: "Mean Extraneous Load (EL)" },
  { key: "gl1",                          title: "GL1 (Formula-Graph Link)" },
  { key: "gl2",                          title: "GL2 (String Trace Tracing)" },
  { key: "gl3",                          title: "GL3 (Minimization Systematic Logic)" },
  { key: "gl4",                          title: "GL4 (Mental Schema Construction)" },
  { key: "mean_gl",                      title: "Mean Germane Load (GL)" },

  // 3. Intrinsic Motivation Inventory (1 to 7)
  { key: "imi_1",                        title: "IMI1 (Interest / Enjoyment)" },
  { key: "imi_2",                        title: "IMI2 (Intellectual Satisfaction)" },
  { key: "imi_3",                        title: "IMI3 (Competence: Conversion)" },
  { key: "imi_4",                        title: "IMI4 (Competence: Minimization)" },
  { key: "imi_5",                        title: "IMI5 (Perceived Utility)" },
  { key: "imi_6",                        title: "IMI6 (Educational Value)" },
  { key: "imi_7",                        title: "IMI7 (Focused Effort)" },
  { key: "imi_8",                        title: "IMI8 (Personal Mastery Goal)" },
  { key: "mean_imi",                     title: "Mean IMI Score" },

  // 4. Part A: Retention Diagnostic MCQs (1 pt each)
  { key: "post_q1_ans",                  title: "Post Q1 (E-Closure Invariant) Answer" },
  { key: "post_q1_score",                title: "Post Q1 Score (0-1)" },
  { key: "post_q2_ans",                  title: "Post Q2 (DFA Accept Rule) Answer" },
  { key: "post_q2_score",                title: "Post Q2 Score (0-1)" },
  { key: "post_q3_ans",                  title: "Post Q3 (Trap State Purpose) Answer" },
  { key: "post_q3_score",                title: "Post Q3 Score (0-1)" },
  { key: "post_q4_ans",                  title: "Post Q4 (P0 Initial Partition) Answer" },
  { key: "post_q4_score",                title: "Post Q4 Score (0-1)" },
  { key: "score_retention_total",        title: "Retention Total Score (0-4)" },

  // 5. Part B: Near-Transfer Diagnostic MCQs (2 pts each)
  { key: "post_q5_ans",                  title: "Post Q5 (Start State Formation) Answer" },
  { key: "post_q5_score",                title: "Post Q5 Score (0-2)" },
  { key: "post_q6_ans",                  title: "Post Q6 (Move 0 Transition) Answer" },
  { key: "post_q6_score",                title: "Post Q6 Score (0-2)" },
  { key: "post_q7_ans",                  title: "Post Q7 (Move 1 Transition) Answer" },
  { key: "post_q7_score",                title: "Post Q7 Score (0-2)" },
  { key: "post_q8_ans",                  title: "Post Q8 (Min States Count) Answer" },
  { key: "post_q8_score",                title: "Post Q8 Score (0-2)" },
  { key: "score_neartransfer_mcq_total", title: "Near-Transfer MCQ Total (0-8)" },

  // 6. Part C: Far-Transfer Diagnostic MCQs (2 pts each)
  { key: "post_q9_ans",                  title: "Post Q9 (Semantic Equivalence) Answer" },
  { key: "post_q9_score",                title: "Post Q9 Score (0-2)" },
  { key: "post_q10_ans",                 title: "Post Q10 (ROM Optimization) Answer" },
  { key: "post_q10_score",               title: "Post Q10 Score (0-2)" },
  { key: "score_fartransfer_mcq_total",  title: "Far-Transfer MCQ Total (0-4)" },

  // 7. Part D: Extended Near-Transfer MCQs (Task G1 Context - 2 pts each)
  { key: "post_q11_ans",                 title: "Post Q11 (G1.1 Start State Formation) Answer" },
  { key: "post_q11_score",               title: "Post Q11 Score (0-2)" },
  { key: "post_q12_ans",                 title: "Post Q12 (G1.2 Move & E-set Transition) Answer" },
  { key: "post_q12_score",               title: "Post Q12 Score (0-2)" },
  { key: "post_q13_ans",                 title: "Post Q13 (G1.3 DFA Accept State Set) Answer" },
  { key: "post_q13_score",               title: "Post Q13 Score (0-2)" },
  { key: "score_part_d_total",           title: "Part D Near-Transfer Total (0-6)" },

  // 8. Part E: Extended Far-Transfer MCQs (Task G2 Critical Analysis - 3 pts each)
  { key: "post_q14_ans",                 title: "Post Q14 (G2.1 Heuristic Validity Assessment) Answer" },
  { key: "post_q14_score",               title: "Post Q14 Score (0-3)" },
  { key: "post_q15_ans",                 title: "Post Q15 (G2.2 Forward Distinguishability Principle) Answer" },
  { key: "post_q15_score",               title: "Post Q15 Score (0-3)" },
  { key: "score_part_e_total",           title: "Part E Far-Transfer Total (0-6)" },
  { key: "total_post_knowledge_score",   title: "Total Post-Test Objective Knowledge Score (0-28)" },

  // 9. Part F: Instructional Usability & Audit Metadata
  { key: "pedagogical_feature",          title: "Pedagogical Feature Most Helpful" },
  { key: "pedagogical_challenge",        title: "Most Challenging Algorithmic Concept" },
  { key: "course_improvement_feedback",  title: "Open Course Improvement Feedback (NLP Corpus)" },
  { key: "time_on_page_seconds",         title: "Duration on Page (Seconds)" },
  { key: "client_timezone",              title: "Client Timezone" },
  { key: "screen_resolution",            title: "Screen Resolution" },
  { key: "user_agent",                   title: "User Agent (Browser/OS)" }
];

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    service: "Post-Session Survey Backend (Sheet 2)",
    ready: true,
    total_columns: POST_SESSION_SCHEMA.length,
    timestamp: new Date()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  if (!e) {
    return ContentService.createTextOutput("Direct execution without payload is not allowed. Use testDoPost() to test.");
  }

  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};

    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // Cognitive Load Computations (0 - 10)
    var il1 = parseFloat(data.cog_il1) || 0;
    var il2 = parseFloat(data.cog_il2) || 0;
    var il3 = parseFloat(data.cog_il3) || 0;
    var mean_il = parseFloat(((il1 + il2 + il3) / 3).toFixed(2));

    var el1 = parseFloat(data.cog_el1) || 0;
    var el2 = parseFloat(data.cog_el2) || 0;
    var el3 = parseFloat(data.cog_el3) || 0;
    var mean_el = parseFloat(((el1 + el2 + el3) / 3).toFixed(2));

    var gl1 = parseFloat(data.cog_gl1) || 0;
    var gl2 = parseFloat(data.cog_gl2) || 0;
    var gl3 = parseFloat(data.cog_gl3) || 0;
    var gl4 = parseFloat(data.cog_gl4) || 0;
    var mean_gl = parseFloat(((gl1 + gl2 + gl3 + gl4) / 4).toFixed(2));

    // Intrinsic Motivation Inventory Computations (1 - 7)
    var imi_vals = [
      parseFloat(data.imi_1) || 0, parseFloat(data.imi_2) || 0,
      parseFloat(data.imi_3) || 0, parseFloat(data.imi_4) || 0,
      parseFloat(data.imi_5) || 0, parseFloat(data.imi_6) || 0,
      parseFloat(data.imi_7) || 0, parseFloat(data.imi_8) || 0
    ];
    var mean_imi = parseFloat((imi_vals.reduce(function(a, b) { return a + b; }, 0) / imi_vals.length).toFixed(2));

    // Part A Keys (1 pt each): Q1=B, Q2=C, Q3=A, Q4=A
    var q1_ans = String(data.post_q1 || "").trim();
    var q2_ans = String(data.post_q2 || "").trim();
    var q3_ans = String(data.post_q3 || "").trim();
    var q4_ans = String(data.post_q4 || "").trim();

    var q1_score = (q1_ans === "B") ? 1 : 0;
    var q2_score = (q2_ans === "C") ? 1 : 0;
    var q3_score = (q3_ans === "A") ? 1 : 0;
    var q4_score = (q4_ans === "A") ? 1 : 0;
    var retention_score = q1_score + q2_score + q3_score + q4_score;

    // Part B Keys (2 pts each): Q5={A, B}, Q6={A, B}, Q7={C}, Q8 contains "3 states"
    var q5_ans = String(data.post_q5 || "").trim();
    var q6_ans = String(data.post_q6 || "").trim();
    var q7_ans = String(data.post_q7 || "").trim();
    var q8_ans = String(data.post_q8 || "").trim();

    var q5_score = (q5_ans === "{A, B}") ? 2 : 0;
    var q6_score = (q6_ans === "{A, B}") ? 2 : 0;
    var q7_score = (q7_ans === "{C}") ? 2 : 0;
    var q8_score = (q8_ans.indexOf("3 states") !== -1) ? 2 : 0;
    var near_transfer_mcq = q5_score + q6_score + q7_score + q8_score;

    // Part C Keys (2 pts each): Q9 contains "Yes. Both belong...", Q10 contains "8 transition entries"
    var q9_ans = String(data.post_q9 || "").trim();
    var q10_ans = String(data.post_q10 || "").trim();

    var q9_score = (q9_ans.indexOf("Yes. Both belong to the same accepting block") !== -1) ? 2 : 0;
    var q10_score = (q10_ans.indexOf("8 transition entries") !== -1) ? 2 : 0;
    var far_transfer_mcq = q9_score + q10_score;

    // Part D Keys (2 pts each): Q11={1, 2}, Q12 contains BOTH "On 'a' -> {1, 2}" AND "On 'b' -> {2, 3}", Q13 contains "{{2, 3}, {3}}"
    var q11_ans = String(data.post_q11 || data.post_g1_1 || "").trim();
    var q12_ans = String(data.post_q12 || data.post_g1_2 || "").trim();
    var q13_ans = String(data.post_q13 || data.post_g1_3 || "").trim();

    var q11_score = (q11_ans === "{1, 2}" || q11_ans.indexOf("{1, 2}") !== -1) ? 2 : 0;
    var q12_score = (q12_ans.indexOf("On 'a' -> {1, 2}") !== -1 && q12_ans.indexOf("On 'b' -> {2, 3}") !== -1) ? 2 : 0;
    var q13_score = (q13_ans.indexOf("{{2, 3}, {3}}") !== -1) ? 2 : 0;
    var part_d_total = q11_score + q12_score + q13_score;

    // Part E Keys (3 pts each): Q14 contains "Invalid: Incoming edge count", Q15 contains "forward distinguishability"
    var q14_ans = String(data.post_q14 || data.post_g2_1 || "").trim();
    var q15_ans = String(data.post_q15 || data.post_g2_2 || "").trim();

    var q14_score = (q14_ans.indexOf("Invalid: Incoming edge count only reflects past reachability") !== -1) ? 3 : 0;
    var q15_score = (q15_ans.indexOf("forward distinguishability") !== -1) ? 3 : 0;
    var part_e_total = q14_score + q15_score;

    var total_knowledge_score = retention_score + near_transfer_mcq + far_transfer_mcq + part_d_total + part_e_total;

    var record = {
      timestamp: new Date(),
      participant_id: (data.participant_id || "").toString().trim() || "NOT_PROVIDED",
      neptun_code: (data.neptun_code || "").toString().trim().toUpperCase(),
      student_name: (data.student_name || "").toString().trim(),
      teacher_official_grade: "",
      ip_address: data.ip_address || "unknown",

      // Cognitive Load
      il1: il1, il2: il2, il3: il3, mean_il: mean_il,
      el1: el1, el2: el2, el3: el3, mean_el: mean_el,
      gl1: gl1, gl2: gl2, gl3: gl3, gl4: gl4, mean_gl: mean_gl,

      // IMI
      imi_1: imi_vals[0], imi_2: imi_vals[1], imi_3: imi_vals[2], imi_4: imi_vals[3],
      imi_5: imi_vals[4], imi_6: imi_vals[5], imi_7: imi_vals[6], imi_8: imi_vals[7],
      mean_imi: mean_imi,

      // Part A
      post_q1_ans: q1_ans, post_q1_score: q1_score,
      post_q2_ans: q2_ans, post_q2_score: q2_score,
      post_q3_ans: q3_ans, post_q3_score: q3_score,
      post_q4_ans: q4_ans, post_q4_score: q4_score,
      score_retention_total: retention_score,

      // Part B
      post_q5_ans: q5_ans, post_q5_score: q5_score,
      post_q6_ans: q6_ans, post_q6_score: q6_score,
      post_q7_ans: q7_ans, post_q7_score: q7_score,
      post_q8_ans: q8_ans, post_q8_score: q8_score,
      score_neartransfer_mcq_total: near_transfer_mcq,

      // Part C
      post_q9_ans: q9_ans, post_q9_score: q9_score,
      post_q10_ans: q10_ans, post_q10_score: q10_score,
      score_fartransfer_mcq_total: far_transfer_mcq,

      // Part D Objective MCQs
      post_q11_ans: q11_ans, post_q11_score: q11_score,
      post_q12_ans: q12_ans, post_q12_score: q12_score,
      post_q13_ans: q13_ans, post_q13_score: q13_score,
      score_part_d_total: part_d_total,

      // Part E Objective MCQs
      post_q14_ans: q14_ans, post_q14_score: q14_score,
      post_q15_ans: q15_ans, post_q15_score: q15_score,
      score_part_e_total: part_e_total,
      total_post_knowledge_score: total_knowledge_score,

      // Part F Feedback & Audit (Optional)
      pedagogical_feature: data.pedagogical_feature || "",
      pedagogical_challenge: data.pedagogical_challenge || "",
      course_improvement_feedback: data.course_improvement_feedback || "",
      time_on_page_seconds: parseFloat(data.time_on_page_seconds) || 0,
      client_timezone: data.client_timezone || "",
      screen_resolution: data.screen_resolution || "",
      user_agent: data.user_agent || ""
    };

    var alignedRow = getAlignedRowData(sheet, record, POST_SESSION_SCHEMA, "#0f172a");
    sheet.appendRow(alignedRow);

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      participant_id: record.participant_id,
      total_score: total_knowledge_score
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function getAlignedRowData(sheet, record, schema, headerBgColor) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    var titles = schema.map(function(col) { return col.title; });
    sheet.appendRow(titles);
    styleHeaderRow(sheet, titles.length, headerBgColor);
    return schema.map(function(col) {
      return (record[col.key] !== undefined && record[col.key] !== null) ? record[col.key] : "";
    });
  }

  var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var normalizedExisting = existingHeaders.map(normalizeHeader);

  schema.forEach(function(col) {
    var normTitle = normalizeHeader(col.title);
    var normKey = normalizeHeader(col.key);
    if (normalizedExisting.indexOf(normTitle) === -1 && normalizedExisting.indexOf(normKey) === -1) {
      existingHeaders.push(col.title);
      normalizedExisting.push(normTitle);
      sheet.getRange(1, existingHeaders.length).setValue(col.title);
    }
  });

  var lookup = {};
  schema.forEach(function(col) {
    lookup[normalizeHeader(col.title)] = record[col.key];
    lookup[normalizeHeader(col.key)] = record[col.key];
  });

  var alignedRow = [];
  for (var i = 0; i < existingHeaders.length; i++) {
    var normHeader = normalizeHeader(existingHeaders[i]);
    if (lookup.hasOwnProperty(normHeader)) {
      var val = lookup[normHeader];
      alignedRow.push((val !== undefined && val !== null) ? val : "");
    } else {
      alignedRow.push("");
    }
  }

  return alignedRow;
}

function styleHeaderRow(sheet, colCount, headerBgColor) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setFontWeight("bold");
  headerRange.setBackground(headerBgColor);
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setWrap(true);
  sheet.setRowHeight(1, 40);
  sheet.setFrozenRows(1);
}

function normalizeHeader(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function setupPostSessionSheetHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();

  if (lastRow === 0 || lastCol === 0) {
    var titles = POST_SESSION_SCHEMA.map(function(col) { return col.title; });
    sheet.appendRow(titles);
    styleHeaderRow(sheet, titles.length, "#0f172a");
  } else {
    var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var normalizedExisting = existingHeaders.map(normalizeHeader);
    POST_SESSION_SCHEMA.forEach(function(col) {
      var normTitle = normalizeHeader(col.title);
      if (normalizedExisting.indexOf(normTitle) === -1) {
        existingHeaders.push(col.title);
        normalizedExisting.push(normTitle);
        sheet.getRange(1, existingHeaders.length).setValue(col.title);
      }
    });
    styleHeaderRow(sheet, existingHeaders.length, "#0f172a");
  }
  SpreadsheetApp.flush();
  Logger.log("Post-Session Sheet headers synchronized non-destructively.");
}

function testDoPost() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        participant_id: "SZE-TEST01",
        neptun_code: "XYZ999",
        student_name: "Test Student",
        ip_address: "127.0.0.1",
        cog_il1: 6, cog_il2: 7, cog_il3: 5,
        cog_el1: 2, cog_el2: 1, cog_el3: 2,
        cog_gl1: 8, cog_gl2: 9, cog_gl3: 8, cog_gl4: 9,
        imi_1: 6, imi_2: 6, imi_3: 5, imi_4: 5,
        imi_5: 6, imi_6: 7, imi_7: 6, imi_8: 6,
        post_q1: "B", post_q2: "C", post_q3: "A", post_q4: "A",
        post_q5: "{A, B}", post_q6: "{A, B}", post_q7: "{C}",
        post_q8: "3 states: {A, B}, {C}, and Trap",
        post_q9: "Yes. Both belong to the same accepting block in P0 and produce identical infinite transition signatures within that block.",
        post_q10: "It eliminates exactly 8 transition entries in the lookup array (a 40% memory reduction).",
        post_q11: "{1, 2}",
        post_q12: "On 'a' -> {1, 2}; On 'b' -> {2, 3}",
        post_q13: "Exactly {{2, 3}, {3}}",
        post_q14: "Invalid: Incoming edge count only reflects past reachability. Two states may transition to different partitions on symbol 'a' (e.g., Sx to accept while Sy to trap), distinguishing their accepted futures.",
        post_q15: "By analyzing forward distinguishability over all possible suffixes w in Σ* (future behavior) starting from P0 = {Q \\ F, F}, completely ignoring retrospective incoming edge counts.",
        pedagogical_feature: "The step-by-step state transition diagrams and visual graph topologies",
        pedagogical_challenge: "None, all transformation algorithms were clear",
        course_improvement_feedback: "More worked-out step-by-step visualizations for complex regex conversions would be very helpful.",
        time_on_page_seconds: 450,
        client_timezone: "Europe/Budapest",
        screen_resolution: "1920x1080",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      })
    }
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}
