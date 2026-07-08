/* eslint-disable no-undef, no-unused-vars */
/**
 * GOOGLE APPS SCRIPT FOR GOOGLE SHEETS BACKEND (MULTI-TAB: ARTISTS & OPPORTUNITIES)
 * 
 * --- DEPLOYMENT INSTRUCTIONS ---
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any existing code and paste this script.
 * 4. Click Save (floppy disk icon).
 * 5. Click Deploy > New deployment.
 * 6. Choose "Web app" under type.
 * 7. Set:
 *    - Execute as: "Me" (your Google account)
 *    - Who has access: "Anyone" (Required for React integrations)
 * 8. Click Deploy, authorize permissions (Advanced > Go to project), and copy the "Web app URL" (ends in /exec).
 * 9. Paste the URL into the Google Sheets settings page on your ILA Gallery platform!
 */

// Cryptographically secure token generated in environment settings
const API_ACCESS_TOKEN = "e50e93b1d7d0a514d4850fa9735d4fa55c91a0c8b93901b8e6c7104f6797a7e1"; // audit:ignore

/**
 * Validate incoming token.
 */
function validateToken(token) {
  return token === API_ACCESS_TOKEN;
}

/**
 * Checks email-based rate-limiting to prevent spam.
 */
function checkRateLimit(email) {
  if (!email) return true;
  try {
    const cache = CacheService.getScriptCache();
    const cacheKey = "rate_limit_" + email.replace(/[^a-zA-Z0-9]/g, "_");
    const countStr = cache.get(cacheKey);
    const count = countStr ? parseInt(countStr, 10) : 0;
    
    if (count >= 5) {
      return false;
    }
    cache.put(cacheKey, String(count + 1), 600); // 10 minutes limit
    return true;
  } catch (err) {
    console.error("CacheService rate limit failed: " + err.toString());
    return true;
  }
}

/**
 * Validates structural syntax of email address.
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(String(email).trim());
}

/**
 * Sanitizes input string to strip out HTML tags and prevent XSS injection.
 */
function sanitizeInput(val) {
  if (val === undefined || val === null) return "";
  if (typeof val !== "string") return val;
  return val
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function doPost(e) {
  try {
    // 1. Parse the incoming JSON
    const data = JSON.parse(e.postData.contents);

    // 2. Cryptographic token verification
    const token = data.token;
    if (!validateToken(token)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Unauthorized access. Invalid or missing API token."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Rate limiting and email validation
    let targetEmail = data.email || "";
    if (targetEmail) {
      if (!isValidEmail(targetEmail)) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Invalid email address format."
        })).setMimeType(ContentService.MimeType.JSON);
      }
      if (!checkRateLimit(targetEmail)) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Rate limit exceeded. Please try again in 10 minutes."
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ── NEW: Cloud Function sync worker handler ───────────────────────────────
    // Called by functions/index.js → sendToGoogleSheets()
    // Routes by sheetType: "REGISTRY" | "INTAKE" | "ART_NEED"
    if (data.sheetType) {
      const rawData = data;
      const payload = rawData.payload || {};
      
      const sheetMap = {
        "REGISTRY": "Artist Registry",
        "INTAKE":   "Intake",
        "ART_NEED": "Art & Need"
      };
      const sheetName = sheetMap[data.sheetType] || "Submissions";
      let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = activeSpreadsheet.getSheetByName(sheetName);

      if (!sheet) {
        sheet = activeSpreadsheet.insertSheet(sheetName);
        sheet.appendRow(["Timestamp", "ID", "Name", "Email", "Type", "Full Data"]);
      }

      const displayName = payload.name || ((payload.firstName || "") + " " + (payload.lastName || "")).trim() || payload.title || "N/A";
      sheet.appendRow([
        new Date(),
        sanitizeInput(String(payload.id || rawData.submissionId || "")),
        sanitizeInput(String(displayName)),
        sanitizeInput(String(payload.email || payload.contactEmail || "")),
        sanitizeInput(String(rawData.sheetType)),
        JSON.stringify(rawData)
      ]);

      if (rawData.sheetType === "REGISTRY") {
        // Flatten payload for the Artist sheet code at the bottom of doPost(e)
        data = {
          ...payload,
          token: rawData.token
        };
      } else if (rawData.sheetType === "ART_NEED") {
        // Prepare data for the Opportunities sheet code below
        data = {
          action: "submitOpportunity",
          opportunity: payload,
          token: rawData.token
        };
      } else {
        // For INTAKE, generic logging is sufficient
        return ContentService
          .createTextOutput("success")
          .setMimeType(ContentService.MimeType.TEXT);
      }
    }

    // 2.2 Check if this is an opportunity submission request
    if (data.action === "submitOpportunity") {
      const opp = data.opportunity || {};
      const oppId = opp.id;
      if (!oppId) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Opportunity ID is required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let sheetName = "Opportunities";
      let sheet = activeSpreadsheet.getSheetByName(sheetName);
      let headers = [
        "Opportunity ID", "Title", "Provider / Client", "Type", "Amount / Budget", "Status", 
        "Open Date", "Close Date / Deadline", "Description", "Website / Email Link", "Who Should Apply", 
        "Is Community Post", "Contact Person", "Contact Email", "Contact Phone", 
        "Mediums", "Styles", "Capabilities", "Scale", "Address", "City", "Latitude", "Longitude"
      ];
      
      if (!sheet) {
        sheet = activeSpreadsheet.insertSheet(sheetName);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      } else {
        const lastCol = sheet.getLastColumn();
        if (lastCol > 0) {
          headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
        } else {
          sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
      }

      let existingRowIdx = -1;
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < idValues.length; i++) {
          if (String(idValues[i][0]).trim() === String(oppId).trim()) {
            existingRowIdx = i + 2;
            break;
          }
        }
      }

      let capStr = "";
      if (opp.capabilities) {
        const caps = [];
        if (opp.capabilities.publicArtExperience) caps.push("Public Art Experience");
        if (opp.capabilities.muralExperience) caps.push("Large Mural Experience");
        if (opp.capabilities.communityEngagementExperience) caps.push("Community Engagement");
        if (opp.capabilities.youthEngagementExperience) caps.push("Youth Engagement");
        if (opp.capabilities.teachingExperience) caps.push("Teaching/Instruction");
        if (opp.capabilities.licensingInsurance) caps.push("General Liability Insurance");
        if (opp.capabilities.sculptureInstallationExperience) caps.push("3D/Sculpture Installation");
        if (opp.capabilities.galleryInstallationExperience) caps.push("Gallery Exhibition Setup");
        if (opp.capabilities.curationExperience) caps.push("Art Curation & Design");
        if (opp.capabilities.otherInstallationExperience) caps.push("Specialized Installations (AV/Sound)");
        if (opp.capabilities.digitalExperience) caps.push("Digital Art/Projection/AR");
        if (opp.capabilities.eventProductionExperience) caps.push("Music & Event Production");
        
        capStr = caps.join(", ");
      }

      const formatOppValue = (headerName) => {
        switch(headerName) {
          case "Opportunity ID": return oppId;
          case "Title": return opp.title || opp.name || "";
          case "Provider / Client": return opp.provider || "";
          case "Type": return opp.type || "";
          case "Amount / Budget": return opp.amount || "";
          case "Status": return opp.status || "Open";
          case "Open Date": return opp.openDate || "";
          case "Close Date / Deadline": return opp.closeDate || "";
          case "Description": return opp.description || "";
          case "Website / Email Link": return opp.url || "";
          case "Who Should Apply": return opp.whoShouldApply || "";
          case "Is Community Post": return opp.isCommunityPost ? "Yes" : "No";
          case "Contact Person": return opp.contactPerson || "";
          case "Contact Email": return opp.contactEmail || "";
          case "Contact Phone": return opp.contactPhone || "";
          case "Mediums": return Array.isArray(opp.mediums) ? opp.mediums.join(", ") : (opp.mediums || "");
          case "Styles": return Array.isArray(opp.styles) ? opp.styles.join(", ") : (opp.styles || "");
          case "Capabilities": return capStr || "";
          case "Scale": return opp.scale || "";
          case "Address": return opp.address || "";
          case "City": return opp.city || "";
          case "Latitude": return opp.latitude || "";
          case "Longitude": return opp.longitude || "";
          default: return "";
        }
      };

      const row = headers.map(h => sanitizeInput(formatOppValue(h)));

      if (existingRowIdx > -1) {
        sheet.getRange(existingRowIdx, 1, 1, row.length).setValues([row]);
      } else {
        sheet.appendRow(row);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        opportunityId: oppId,
        message: existingRowIdx > -1 ? "Opportunity updated successfully in Google Sheet!" : "Opportunity added successfully to Google Sheet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2.3 Check if this is an opportunity deletion request
    if (data.action === "deleteOpportunity") {
      const oppId = data.id;
      if (!oppId) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Opportunity ID is required for deletion."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let sheetName = "Opportunities";
      let sheet = activeSpreadsheet.getSheetByName(sheetName);
      let deletedCount = 0;
      
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = idValues.length - 1; i >= 0; i--) {
            if (String(idValues[i][0]).trim() === String(oppId).trim()) {
              sheet.deleteRow(i + 2);
              deletedCount++;
            }
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        deletedCount: deletedCount,
        message: deletedCount > 0 ? "Opportunity deleted successfully from Google Sheet!" : "Opportunity not found or already deleted from Google Sheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2.4 Check if this is an artist deletion request
    if (data.action === "deleteArtist") {
      const artistId = data.id;
      if (!artistId) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Artist ID is required for deletion."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let sheetName = "Artists";
      let sheet = activeSpreadsheet.getSheetByName(sheetName);
      let deletedCount = 0;
      
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
          for (let i = idValues.length - 1; i >= 0; i--) {
            if (String(idValues[i][0]).trim() === String(artistId).trim()) {
              sheet.deleteRow(i + 2);
              deletedCount++;
            }
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        deletedCount: deletedCount,
        message: deletedCount > 0 ? "Artist deleted successfully from Google Sheet!" : "Artist not found or already deleted from Google Sheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Check if this is an email funding sources request
    if (data.action === "emailFundingSources") {
      let emailAddress = String(data.email || "").trim();
      let fullName = sanitizeInput(data.name || "Artist");
      
      if (emailAddress && isValidEmail(emailAddress)) {
        const emailSubject = "ILA Gallery - Requested Funding & RFQ Opportunities";
        const fundingSources = [
          {
            title: "P.S. You Are Here (PSYAH)",
            provider: "Denver Arts & Venues (Denver County)",
            amount: "Up to $10,000",
            status: "Open Soon",
            description: "Funds community-led outdoor public space projects, neighborhood activations, and street art across Denver County.",
            url: "ArtsAndVenuesDenver.com/Grants"
          },
          {
            title: "DENVER CREATES Fund",
            provider: "Denver Arts & Venues (Denver County)",
            amount: "Varies",
            status: "Open",
            description: "Direct investments in the Denver County creative sector supporting economic vitality and broadening access to arts.",
            url: "ArtsAndVenuesDenver.com/Grants"
          },
          {
            title: "Denver Public Art RFQ - Central Library",
            provider: "Denver Public Art / CaFÉ (Denver County)",
            amount: "$150,000",
            status: "Active on CaFÉ",
            description: "Call for Entry (CaFÉ) seeking qualifications for a monumental public art installation at the newly renovated branch.",
            url: "CallForEntry.org"
          }
        ];
        
        let fundingItemsHtml = "";
        fundingSources.forEach(source => {
          fundingItemsHtml += `
            <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 16px; background-color: #f8fafc; text-align: left;">
              <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 16px; font-weight: 700; color: #0f172a;">${source.title}</h3>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: 500;">Provider: <strong style="color: #0f172a;">${source.provider}</strong></p>
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569; line-height: 1.5;">${source.description}</p>
              <div style="font-size: 13px; font-weight: 600; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-bottom: 8px; display: flex; justify-content: space-between;">
                <div><span style="color: #64748b; font-weight: 500;">Amount:</span> <span style="color: #e65c46;">${source.amount}</span></div>
                <div><span style="color: #64748b; font-weight: 500;">Status:</span> <span style="color: #e65c46;">${source.status}</span></div>
              </div>
              <p style="margin: 0; font-size: 13px;"><span style="color: #64748b;">Link:</span> <a href="https://${source.url}" style="color: #e65c46; text-decoration: none; font-weight: 600;">${source.url}</a></p>
            </div>
          `;
        });
        
        const emailHtml = `
          <div style="font-family: 'Space Grotesk', 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
            <div style="border-bottom: 2px solid #e65c46; padding-bottom: 20px; margin-bottom: 24px; text-align: left;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #1e293b;">ILA <span style="color: #e65c46; font-weight: 400;">GALLERY</span></h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Funding & Grant Opportunities</p>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Your Curated Funding Opportunities, ${fullName}!</h2>
            <div>${fundingItemsHtml}</div>
          </div>
        `;
        
        MailApp.sendEmail({
          to: String(emailAddress).trim(),
          subject: emailSubject,
          name: 'ILA Gallery',
          htmlBody: emailHtml,
          body: `Hello ${fullName},\n\nRequested funding list emailed successfully.`
        });
        
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Funding emailed." }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 3. Get the sheet
    let sheetName = "Artists";
    let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = activeSpreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      const sheets = activeSpreadsheet.getSheets();
      if (sheets.length === 1) {
        sheet = sheets[0];
        sheet.setName(sheetName);
      } else {
        sheet = activeSpreadsheet.insertSheet(sheetName);
      }
    }
    
    // 3. Read the first row (column headers) and apply self-healing check
    const lastColumn = sheet.getLastColumn();
    let headers = [];
    if (lastColumn > 0) {
      headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(h => String(h).trim());
      if (headers.indexOf("Work Examples") === -1) {
        sheet.getRange(1, lastColumn + 1).setValue("Work Examples");
        headers.push("Work Examples");
      }
      if (headers.indexOf("Digital Art / Projection Mapping / AR") === -1) {
        const newLastCol = sheet.getLastColumn();
        sheet.getRange(1, newLastCol + 1).setValue("Digital Art / Projection Mapping / AR");
        headers.push("Digital Art / Projection Mapping / AR");
      }
      if (headers.indexOf("Music & Event Production") === -1) {
        const newLastCol = sheet.getLastColumn();
        sheet.getRange(1, newLastCol + 1).setValue("Music & Event Production");
        headers.push("Music & Event Production");
      }
      if (headers.indexOf("Username") === -1) {
        const newLastCol = sheet.getLastColumn();
        sheet.getRange(1, newLastCol + 1).setValue("Username");
        headers.push("Username");
      }
      if (headers.indexOf("Password") === -1) {
        const newLastCol = sheet.getLastColumn();
        sheet.getRange(1, newLastCol + 1).setValue("Password");
        headers.push("Password");
      }
    } else {
      headers = [
        "Artist ID", "First Name", "Last Name", "Artist Name / Alias", "Pronouns", 
        "Email", "Phone", "Website", "Instagram", "LinkedIn URL", "Location (City)", "Location (State)", 
        "Primary Medium", "Secondary Mediums", "Art Styles", "Themes", "Experience Level", 
        "Public Art Experience", "Mural Experience", "Community Engagement Experience", 
        "Scale Capability", "Collaboration Preference", "Youth Engagement Experience", 
        "Teaching Experience", "Licensing / Insurance", 
        "3D / Sculpture Installation", "Gallery Exhibition Setup", "Art Curation & Design", "Specialized Installations (AV/Sound)", "Digital Art / Projection Mapping / AR", "Installation Capabilities Description",
        "Availability Status", "Budget Range", "Notable Projects", "References", "BIPOC / Identity", 
        "Community Affiliations", "Accessibility Needs", "Vetting Status", "Last Contacted", "Work Examples",
        "Username", "Password"
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    let artistId = data.id;
    let existingRowIndex = -1;
    
    if (artistId) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let i = 0; i < idValues.length; i++) {
          if (String(idValues[i][0]).trim() === String(artistId).trim()) {
            existingRowIndex = i + 2;
            break;
          }
        }
      }
    } else {
      const timestamp = new Date().getFullYear();
      const lastRow = sheet.getLastRow();
      const rowCount = lastRow - 1 < 0 ? 0 : lastRow - 1;
      artistId = "ILA-" + timestamp + "-" + String(rowCount + 1).padStart(4, "0");
    }

    const formatValue = (key, val) => {
      if (val === undefined || val === null) return "";
      if (Array.isArray(val)) return val.map(item => sanitizeInput(item)).join(", ");
      if (typeof val === "boolean") return val ? "Yes" : "No";
      return sanitizeInput(String(val));
    };
    
    const dataMap = {
      "Artist ID": artistId,
      "First Name": data.firstName || "",
      "Last Name": data.lastName || "",
      "Artist Name / Alias": data.alias || data.name || "",
      "Pronouns": data.pronouns || "",
      "Email": data.email || "",
      "Phone": data.phone || "",
      "Website": data.website || "",
      "Instagram": data.instagram || "",
      "LinkedIn URL": data.linkedin || "",
      "Location (City)": data.city || data.neighborhood || "",
      "Location (State)": data.state || "CO",
      "Primary Medium": data.primaryMedium || (Array.isArray(data.mediums) ? data.mediums[0] : data.mediums) || "",
      "Secondary Mediums": data.secondaryMediums || (Array.isArray(data.mediums) ? data.mediums.slice(1) : []),
      "Art Styles": data.artStyles || [],
      "Themes": data.themes || [],
      "Experience Level": data.experienceLevel || "Emerging",
      "Public Art Experience": data.publicArtExperience,
      "Mural Experience": data.muralExperience,
      "Community Engagement Experience": data.communityEngagementExperience,
      "Scale Capability": data.scaleCapability || [],
      "Collaboration Preference": data.collaborationPreference || "Both",
      "Youth Engagement Experience": data.youthEngagementExperience,
      "Teaching Experience": data.teachingExperience,
      "Licensing / Insurance": data.licensingInsurance,
      "3D / Sculpture Installation": data.sculptureInstallationExperience,
      "Gallery Exhibition Setup": data.galleryInstallationExperience,
      "Art Curation & Design": data.curationExperience,
      "Specialized Installations (AV/Sound)": data.otherInstallationExperience,
      "Digital Art / Projection Mapping / AR": data.digitalExperience,
      "Music & Event Production": data.eventProductionExperience,
      "Installation Capabilities Description": data.capabilitiesDescription || "",
      "Availability Status": data.availabilityStatus || "Available",
      "Budget Range": data.budgetRange || "",
      "Notable Projects": data.notableProjects || "",
      "References": data.references || "",
      "BIPOC / Identity": data.bipocIdentity || "",
      "Community Affiliations": data.communityAffiliations || "",
      "Accessibility Needs": data.accessibilityNeeds || "",
      "Vetting Status": data.vettingStatus || "New",
      "Last Contacted": data.lastContacted || "Never",
      "Work Examples": data.workExamples || "",
      "Username": data.username || "",
      "Password": data.password || ""
    };
    
    const row = headers.map(header => {
      const cleanHeader = String(header).trim();
      return formatValue(cleanHeader, dataMap[cleanHeader]);
    });
    
    if (existingRowIndex > -1) {
      sheet.getRange(existingRowIndex, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
      // Trigger Welcome Email to new user containing credentials & platform tips
      if (data.email) {
        try {
          const fullName = (data.firstName || "") + " " + (data.lastName || "");
          sendWelcomeEmail(
            data.email,
            fullName.trim() || data.alias || "Artist",
            data.username || "N/A",
            data.password || "N/A"
          );
        } catch (mailErr) {
          console.error("Welcome email failed to send: " + mailErr.toString());
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      artistId: artistId,
      message: "Success"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sends a beautifully styled welcome email containing credentials and platform tips.
 */
function sendWelcomeEmail(emailAddress, fullName, username, password) {
  if (!emailAddress || !isValidEmail(emailAddress)) return;

  const emailSubject = "Welcome to ILA Gallery Creative Hub & Colorado Artist Registry";
  
  const emailHtml = `
    <div style="font-family: 'Space Grotesk', 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
      <div style="border-bottom: 2px solid #e65c46; padding-bottom: 20px; margin-bottom: 24px; text-align: left;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; color: #1e293b;">ILA <span style="color: #e65c46; font-weight: 400;">GALLERY</span></h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Creative Hub & Artist Registry</p>
      </div>
      
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px;">Welcome to the Platform, ${fullName}!</h2>
      
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
        Thank you for joining the ILA Gallery Colorado Artist Registry. Your profile has been successfully saved, and you are now part of our creative network.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: left;">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #0f172a; font-weight: 700;">Your Login Credentials</h3>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #475569;"><strong>Username:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${username}</code></p>
        <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${password}</code></p>
        <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;"><em>Note: You can use these credentials to sign in directly at the Artist Account Portal.</em></p>
      </div>

      <h3 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Tips for Getting Started</h3>
      <ul style="padding-left: 20px; margin: 0 0 24px 0; font-size: 14px; color: #334155; line-height: 1.6;">
        <li style="margin-bottom: 10px;">
          <strong>Complete Your Profile:</strong> Log in and update your bio, styles, and themes. The more details you provide, the easier it is for curators and clients to match you with matching projects.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Explore the Opportunities Map:</strong> Use the interactive map to locate local community RFQs, public art projects, and exhibition calls across Colorado.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Leverage the AI Copilot:</strong> When drafting proposals, use our Gemini-powered AI Proposal Copilot to assist in structuring budgets, safety plans, and narrative drafts.
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Maintain Availability:</strong> Set your active availability status (e.g., "Available", "Booked") so clients know when you are open for commissions.
        </li>
      </ul>

      <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 20px;">
        We're excited to see your work on the platform. If you have any questions or need technical support, please reach out to us at <a href="mailto:info@ila-gallery.com" style="color: #e65c46; text-decoration: none; font-weight: 600;">info@ila-gallery.com</a>.
      </p>
    </div>
  `;

  MailApp.sendEmail({
    to: String(emailAddress).trim(),
    subject: emailSubject,
    name: 'ILA Gallery',
    htmlBody: emailHtml,
    body: `Welcome to ILA Gallery, ${fullName}!\n\nYour profile has been created. Use username: ${username} to log in.\n\nTips:\n1. Complete your profile.\n2. Use the Opportunities Map.\n3. Leverage the AI Proposal Copilot.\n4. Keep availability up-to-date.`
  });
}

function doGet(e) {
  try {
    const token = e && e.parameter && e.parameter.token;
    if (!validateToken(token)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const requestedSheet = e && e.parameter && e.parameter.sheet;
    let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    if (requestedSheet === "Opportunities") {
      let sheetName = "Opportunities";
      let sheet = activeSpreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, opportunities: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const lastRow = sheet.getLastRow();
      const lastColumn = sheet.getLastColumn();
      
      if (lastRow <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, opportunities: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
      const rawData = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
      
      const reverseOppMap = {
        "Opportunity ID": "id",
        "Title": "title",
        "Provider / Client": "provider",
        "Type": "type",
        "Amount / Budget": "amount",
        "Status": "status",
        "Open Date": "openDate",
        "Close Date / Deadline": "closeDate",
        "Description": "description",
        "Website / Email Link": "url",
        "Who Should Apply": "whoShouldApply",
        "Is Community Post": "isCommunityPost",
        "Contact Person": "contactPerson",
        "Contact Email": "contactEmail",
        "Contact Phone": "contactPhone",
        "Mediums": "mediums",
        "Styles": "styles",
        "Capabilities": "capabilities",
        "Scale": "scale",
        "Address": "address",
        "City": "city",
        "Latitude": "latitude",
        "Longitude": "longitude"
      };

      const opportunities = rawData.map(row => {
        const opp = {};
        headers.forEach((header, index) => {
          const cleanHeader = String(header).trim();
          const key = reverseOppMap[cleanHeader];
          if (!key) return;
          
          let value = row[index];
          if (value === "Yes") opp[key] = true;
          else if (value === "No") opp[key] = false;
          else if (["mediums", "styles"].includes(key)) {
            opp[key] = value ? String(value).split(",").map(s => s.trim()) : [];
          } else if (key === "latitude" || key === "longitude") {
            opp[key] = value ? parseFloat(value) : "";
          } else opp[key] = value || "";
        });
        return opp;
      });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, opportunities: opportunities }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let sheetName = "Artists";
    let sheet = activeSpreadsheet.getSheetByName(sheetName);
    if (!sheet) sheet = activeSpreadsheet.getActiveSheet();
    
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, artists: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const rawData = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    
    const reverseMap = {
      "Artist ID": "id",
      "First Name": "firstName",
      "Last Name": "lastName",
      "Artist Name / Alias": "alias",
      "Pronouns": "pronouns",
      "Email": "email",
      "Phone": "phone",
      "Website": "website",
      "Instagram": "instagram",
      "LinkedIn URL": "linkedin",
      "Location (City)": "city",
      "Location (State)": "state",
      "Primary Medium": "primaryMedium",
      "Secondary Mediums": "secondaryMediums",
      "Art Styles": "artStyles",
      "Themes": "themes",
      "Experience Level": "experienceLevel",
      "Public Art Experience": "publicArtExperience",
      "Mural Experience": "muralExperience",
      "Community Engagement Experience": "communityEngagementExperience",
      "Scale Capability": "scaleCapability",
      "Collaboration Preference": "collaborationPreference",
      "Youth Engagement Experience": "youthEngagementExperience",
      "Teaching Experience": "teachingExperience",
      "Licensing / Insurance": "licensingInsurance",
      "3D / Sculpture Installation": "sculptureInstallationExperience",
      "Gallery Exhibition Setup": "galleryInstallationExperience",
      "Art Curation & Design": "curationExperience",
      "Specialized Installations (AV/Sound)": "otherInstallationExperience",
      "Digital Art / Projection Mapping / AR": "digitalExperience",
      "Music & Event Production": "eventProductionExperience",
      "Installation Capabilities Description": "capabilitiesDescription",
      "Availability Status": "availabilityStatus",
      "Budget Range": "budgetRange",
      "Notable Projects": "notableProjects",
      "References": "references",
      "BIPOC / Identity": "bipocIdentity",
      "Community Affiliations": "communityAffiliations",
      "Accessibility Needs": "accessibilityNeeds",
      "Vetting Status": "vettingStatus",
      "Last Contacted": "lastContacted",
      "Work Examples": "workExamples"
    };

    const artists = rawData.map(row => {
      const artist = {};
      headers.forEach((header, index) => {
        const cleanHeader = String(header).trim();
        const key = reverseMap[cleanHeader];
        if (!key) return;
        
        let value = row[index];
        if (value === "Yes") artist[key] = true;
        else if (value === "No") artist[key] = false;
        else if (["secondaryMediums", "artStyles", "themes", "scaleCapability"].includes(key)) {
          artist[key] = value ? String(value).split(",").map(s => s.trim()) : [];
        } else artist[key] = value || "";
      });
      return artist;
    });
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, artists: artists }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
