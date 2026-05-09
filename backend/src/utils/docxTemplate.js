const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { globSync } = require('glob');

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function replaceAll(text, searchValue, replacement) {
  if (!searchValue) return text;
  return text.split(searchValue).join(replacement);
}

function replaceNth(text, searchValue, replacement, occurrenceIndex) {
  if (!searchValue) return text;

  let count = 0;
  let startIndex = 0;
  let result = '';

  while (true) {
    const index = text.indexOf(searchValue, startIndex);
    if (index === -1) {
      result += text.slice(startIndex);
      break;
    }

    count += 1;
    result += text.slice(startIndex, index);

    if (count === occurrenceIndex) {
      result += replacement;
    } else {
      result += searchValue;
    }

    startIndex = index + searchValue.length;
  }

  return result;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceParagraphTextNodes(xml, anchor, updater) {
  const paragraphRegex = new RegExp(`<w:p\\b[\\s\\S]*?${escapeRegExp(anchor)}[\\s\\S]*?<\\/w:p>`, 'g');

  return xml.replace(paragraphRegex, (paragraph) => {
    const textNodeRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
    const nodes = [...paragraph.matchAll(textNodeRegex)];
    const nextTexts = updater(nodes.map((match) => match[2]), paragraph);

    let rebuilt = '';
    let cursor = 0;
    let textIndex = 0;

    for (const match of paragraph.matchAll(textNodeRegex)) {
      rebuilt += paragraph.slice(cursor, match.index);
      const text = nextTexts[textIndex] !== undefined ? nextTexts[textIndex] : match[2];
      rebuilt += `<w:t${match[1]}>${text}</w:t>`;
      cursor = match.index + match[0].length;
      textIndex += 1;
    }

    rebuilt += paragraph.slice(cursor);
    return rebuilt;
  });
}

function replaceTextNodesByIndex(xml, replacements) {
  const replacementMap = new Map(replacements.filter((item) => item && item.index).map((item) => [item.index, item.value]));
  let textIndex = 0;
  const textNodeRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;

  return xml.replace(textNodeRegex, (match, attrs, text) => {
    textIndex += 1;
    if (!replacementMap.has(textIndex)) {
      return match;
    }

    const replacement = replacementMap.get(textIndex);
    return `<w:t${attrs}>${escapeXml(replacement ?? '')}</w:t>`;
  });
}

function replaceModuleCapacityParagraph(xml, moduleCapacityKw) {
  const paragraphRegex = /<w:p\b[\s\S]*?Module Capacity \(KW\)[\s\S]*?<\/w:p>/g;

  return xml.replace(paragraphRegex, (paragraph) => {
    const textNodeRegex = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g;
    const nodes = [...paragraph.matchAll(textNodeRegex)];
    const firstNumericIndex = nodes.findIndex((match) => match[2] === '3.');

    if (firstNumericIndex === -1) {
      return paragraph;
    }

    const replacementValue = escapeXml(moduleCapacityKw || '3.480 KW');
    const updates = new Map([
      [firstNumericIndex, replacementValue],
      [firstNumericIndex + 1, ''],
      [firstNumericIndex + 2, ''],
    ]);

    let rebuilt = '';
    let cursor = 0;
    let textIndex = 0;

    for (const match of paragraph.matchAll(textNodeRegex)) {
      rebuilt += paragraph.slice(cursor, match.index);
      const text = updates.has(textIndex) ? updates.get(textIndex) : match[2];
      rebuilt += `<w:t${match[1]}>${text}</w:t>`;
      cursor = match.index + match[0].length;
      textIndex += 1;
    }

    rebuilt += paragraph.slice(cursor);
    return rebuilt;
  });
}

function formatDate(value, format = 'DD MMM YYYY') {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (num) => String(num).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (format === 'D-MMM-YY') {
    return `${date.getDate()}-${monthNames[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
  }

  return `${pad(date.getDate())} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function resolveTemplatePath() {
  const candidates = [
    process.env.ANNEXURE_TEMPLATE_PATH,
    path.join(__dirname, '..', 'templates', 'annexure-parikh-renewable.docx'),
    'C:\\Users\\Omkar Patil\\Documents\\LinksUS Project\\New CRM Addition Parikh\\ANNEXTURE PARIKH RENEWABLE.docx',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Annexure DOCX template not found. Set ANNEXURE_TEMPLATE_PATH or place the template in backend/src/templates/.');
}

function resolveModelAgreementTemplatePath() {
  const candidates = [
    process.env.MODEL_AGREEMENT_TEMPLATE_PATH,
    path.join(__dirname, '..', 'templates', 'model-agreement-parikh-renewable.docx'),
    'C:\\Users\\Omkar Patil\\Documents\\LinksUS Project\\New CRM Addition Parikh\\Model Agreement PARIKH RENEWABLE.docx',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Model Agreement DOCX template not found. Set MODEL_AGREEMENT_TEMPLATE_PATH or place the template in backend/src/templates/.');
}

function resolveNetMeteringTemplatePath() {
  const candidates = [
    process.env.NET_METERING_TEMPLATE_PATH,
    path.join(__dirname, '..', 'templates', 'net-metering-parikh-renewable.docx'),
    'C:\\Users\\Omkar Patil\\Documents\\LinksUS Project\\New CRM Addition Parikh\\Net Metering PARIKH RENEWABLE.docx',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Net Metering DOCX template not found. Set NET_METERING_TEMPLATE_PATH or place the template in backend/src/templates/.');
}

function resolveUndertakingTemplatePath() {
  const candidates = [
    process.env.UNDERTAKING_TEMPLATE_PATH,
    path.join(__dirname, '..', 'templates', 'undertaking-parikh-renewable.docx'),
    'C:\\Users\\Omkar Patil\\Documents\\LinksUS Project\\New CRM Addition Parikh\\PARIKH RENEWABLE Undertaking.docx',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Undertaking DOCX template not found. Set UNDERTAKING_TEMPLATE_PATH or place the template in backend/src/templates/.');
}

function resolveWorkCompletionTemplatePath() {
  const candidates = [
    process.env.WORK_COMPLETION_TEMPLATE_PATH,
    path.join(__dirname, '..', 'templates', 'work-completion-parikh-renewable.docx'),
    'C:\\Users\\Omkar Patil\\Documents\\LinksUS Project\\New CRM Addition Parikh\\Work_Completion_PARIKH RENEWABLE.docx',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Work Completion DOCX template not found. Set WORK_COMPLETION_TEMPLATE_PATH or place the template in backend/src/templates/.');
}

function buildAddressLines(values) {
  const addressLines = [
    values.installationAddressLine1,
    values.installationAddressLine2,
    values.installationAddressLine3,
  ]
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);

  return addressLines;
}

function buildSiteSentence(values) {
  if (values.siteAddressSentence) {
    return String(values.siteAddressSentence).trim();
  }

  const lines = buildAddressLines(values);
  const pieces = [];

  if (lines[0]) pieces.push(lines[0]);
  if (lines[1]) pieces.push(lines[1]);
  if (lines[2]) pieces.push(lines[2]);
  if (values.siteState) pieces.push(values.siteState);

  return pieces.length ? `AT ${pieces.join(' ')}` : '';
}

async function extractTemplate(templatePath, workDir) {
  const extractedDir = path.join(workDir, 'extracted');
  fs.mkdirSync(extractedDir, { recursive: true });
  const zipPath = path.join(workDir, 'template.zip');

  const psCommand = [
      `$ErrorActionPreference = 'Stop';`,
    `Copy-Item -LiteralPath '${templatePath.replace(/'/g, "''")}' -Destination '${zipPath.replace(/'/g, "''")}' -Force`,
    `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractedDir.replace(/'/g, "''")}' -Force`,
  ].join('; ');

  execFileSync('powershell.exe', ['-NoProfile', '-Command', psCommand], { stdio: 'ignore' });
  return extractedDir;
}

function applyDocumentXmlReplacements(xml, values) {
  const beneficiaryName = escapeXml(values.beneficiaryName || values.client || '');
  const consumerNumber = escapeXml(values.consumerNumber || '');
  const mobileNumber = escapeXml(values.mobileNumber || values.contactNumber || '');
  const email = escapeXml(values.email || '');

  const addressLines = buildAddressLines(values).map(escapeXml);
  const addressLine1 = addressLines[0] || '';
  const addressLine2 = addressLines[1] || '';
  const addressLine3 = addressLines[2] || '';

  const reArrangementType = escapeXml(values.reArrangementType || 'Net Metering Arrangement');
  const reSource = escapeXml(values.reSource || 'Solar Roof top');
  const sanctionedCapacityKw = escapeXml(values.sanctionedCapacityKw || '');
  const capacityType = escapeXml(values.capacityType || 'Rooftop');
  const projectModel = escapeXml(values.projectModel || 'Capex');

  const rooftopInstalledCapacityKw = escapeXml(values.rooftopInstalledCapacityKw || 'NA');
  const rooftopGroundInstalledCapacityKw = escapeXml(values.rooftopGroundInstalledCapacityKw || 'NA');
  const groundInstalledCapacityKw = escapeXml(values.groundInstalledCapacityKw || 'NA');

  const installationDate = formatDate(values.installationDate, 'D-MMM-YY');
  const installationDateDisplay = formatDate(values.installationDate, 'DD MMM YYYY');
  const inspectionDateDisplay = formatDate(values.inspectionDate || values.installationDate, 'DD MMM YYYY');

  const inverterCapacityKw = escapeXml(values.inverterCapacityKw || '');
  const inverterMake = escapeXml(values.inverterMake || '');
  const pvModules = escapeXml(values.pvModules || '');
  const moduleCapacityKw = escapeXml(values.moduleCapacityKw || '');
  const agencyName = escapeXml(values.agencyName || 'PARIKH RENEWABLE PRIVATE LIMITED');
  const siteSentence = escapeXml(buildSiteSentence(values));

  xml = replaceAll(xml, 'GHOGARE VENKAT LIMBRAJ', beneficiaryName);
  xml = replaceAll(xml, '590010166383', consumerNumber);
  xml = replaceAll(xml, '9922469678', mobileNumber);
  xml = replaceAll(xml, 'venkatghogare@gmail.com', email);
  xml = replaceAll(xml, 'VENKATESH NIVAS,', addressLine1);
  xml = replaceAll(xml, 'RAM NAGAR', addressLine2);
  xml = replaceAll(xml, 'BAD TO &amp; DIST. OSMANABAD', addressLine3 || 'BAD TO &amp; DIST. OSMANABAD');
  xml = replaceAll(xml, 'DHARASHIV 413501', escapeXml(values.addressPostalLine || 'DHARASHIV 413501'));
  xml = replaceAll(xml, 'Net Metering Arrangement', reArrangementType);
  xml = replaceAll(xml, 'Solar Roof top', reSource);
  xml = replaceAll(xml, '3 kW', sanctionedCapacityKw ? `${sanctionedCapacityKw} kW` : '3 kW');
  xml = replaceAll(xml, 'Rooftop', capacityType);
  xml = replaceAll(xml, 'Capex', projectModel);
  xml = replaceNth(xml, 'NA', rooftopInstalledCapacityKw, 1);
  xml = replaceNth(xml, 'NA', rooftopGroundInstalledCapacityKw, 2);
  xml = replaceNth(xml, 'NA', groundInstalledCapacityKw, 3);
  xml = replaceAll(xml, '5-Nov-25', installationDate);
  xml = replaceAll(xml, '3 KWp', sanctionedCapacityKw ? `${sanctionedCapacityKw} KWp` : '3 KWp');
  xml = replaceAll(xml, 'PARIKH RENEWABLE PRIVATE LIMITED', agencyName);
  xml = replaceAll(xml, '05 Nov 2025', inspectionDateDisplay || installationDateDisplay);
  xml = replaceAll(xml, '3.3 KW', inverterCapacityKw ? `${inverterCapacityKw} KW` : '3.3 KW');
  xml = replaceAll(xml, '06 Nos', pvModules ? `${pvModules} Nos` : '06 Nos');
  xml = replaceModuleCapacityParagraph(xml, moduleCapacityKw ? `${moduleCapacityKw} KW` : '3.480 KW');

  if (siteSentence) {
    xml = replaceAll(xml, 'AT VENKATESH NIVAS,RAM NAGAR O BAD TQ &amp; DIST. OSMANABAD DHARASHIV 413501', siteSentence);
  }

  return xml;
}

function splitAddressParts(value, fallbackParts = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }

  if (!value) {
    return fallbackParts.filter(Boolean);
  }

  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyModelAgreementXmlReplacements(xml, values) {
  const agreementDate = formatDate(values.agreementDate, 'DD (Day) MMM (Month) YYYY (Year)') || '05 (Day) Nov (Month) 2025 (Year)';
  const applicantName = values.consumerName || values.applicantName || 'GHOGRE VENKAT LIMBRAJ';
  const consumerNumber = values.consumerNumber || '590010166383';
  const discomName = values.discomName || 'MSEDCL';
  const applicantAddressParts = splitAddressParts(values.applicantAddress || values.installationAddress || values.addressLine, [
    values.applicantAddressLine1 || 'VENKATESH NIVAS,',
    values.applicantAddressLine2 || 'RAM NAGAR O BAD TQ & DIST. OSMANABAD DHARASHIV',
    values.applicantAddressLine3 || '413501',
  ]);
  const vendorAddressParts = splitAddressParts(values.vendorRegisteredAddress || values.vendorAddress, [
    values.vendorAddressLine1 || 'D 401,',
    values.vendorAddressLine2 || 'Freedom Tower',
    values.vendorAddressLine3 || ', A',
    values.vendorAddressLine4 || 'kashwani Ch',
    values.vendorAddressLine5 || 'owk',
    values.vendorAddressLine6 || ', S',
    values.vendorAddressLine7 || 'ambhajinagar ',
    values.vendorAddressLine8 || '431001.',
  ]);

  const sanitizedApplicantParts = [
    applicantAddressParts[0] || '',
    applicantAddressParts[1] || '',
    applicantAddressParts[2] || '',
  ];
  const sanitizedVendorParts = [
    vendorAddressParts[0] || '',
    vendorAddressParts[1] || '',
    vendorAddressParts[2] || '',
    vendorAddressParts[3] || '',
    vendorAddressParts[4] || '',
    vendorAddressParts[5] || '',
    vendorAddressParts[6] || '',
    vendorAddressParts[7] || '',
  ];

  const replacements = [
    { index: 16, value: applicantName },
    { index: 18, value: consumerNumber },
    { index: 20, value: discomName },
    { index: 21, value: ` (DISCOM Address ${sanitizedApplicantParts[0]}` },
    { index: 23, value: sanitizedApplicantParts[1] },
    { index: 25, value: `${sanitizedApplicantParts[2]} (here in after referred as Applicant).` },
    { index: 29, value: values.vendorCompanyName || 'PARIKH RENEWABLE PRIVATE LIMITED' },
    { index: 31, value: sanitizedVendorParts[0] },
    { index: 32, value: sanitizedVendorParts[1] },
    { index: 33, value: sanitizedVendorParts[2] },
    { index: 34, value: sanitizedVendorParts[3] },
    { index: 35, value: sanitizedVendorParts[4] },
    { index: 36, value: sanitizedVendorParts[5] },
    { index: 37, value: sanitizedVendorParts[6] },
    { index: 38, value: sanitizedVendorParts[7] },
    { index: 82, value: values.sanctionedCapacityKwp || values.sanctionedCapacityKw || '3' },
    { index: 91, value: values.moduleMake || 'WAAREE' },
    { index: 93, value: values.moduleModel || 'BI-60-580' },
    { index: 94, value: '' },
    { index: 95, value: '' },
    { index: 96, value: '' },
    { index: 97, value: '' },
    { index: 99, value: values.moduleWattage || '580' },
    { index: 100, value: '' },
    { index: 101, value: '' },
    { index: 104, value: values.moduleEfficiency || '21.68%' },
    { index: 108, value: values.inverterMake || 'WAAREE' },
    { index: 110, value: values.inverterModel || 'W1-3.3 K-G3' },
    { index: 112, value: values.inverterRatedCapacityKwp || '3.3' },
    { index: 122, value: values.totalProjectCost || '1,77,000/-' },
    { index: 127, value: values.advancePaymentPercentage || '20%' },
    { index: 129, value: values.piPaymentPercentage || '40%' },
    { index: 131, value: values.installationPaymentPercentage || '40%' },
    { index: 191, value: values.maintenancePeriodYears || 'Five Year' },
    { index: 225, value: values.warrantyYears || 'Ten years' },
    { index: 245, value: values.cancellationFeePercentage || '10%' },
  ];

  xml = replaceAll(xml, '05 (Day) Nov (Month) 2025 (Year)', agreementDate);
  xml = replaceAll(xml, 'Five years comprehensive maintenance', 'Five years comprehensive maintenance');
  xml = replaceTextNodesByIndex(xml, replacements);

  return xml;
}

function formatNetMeteringDate(value) {
  if (!value) return '05/ 11 /2025';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '05/ 11 /2025';

  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(date.getDate())}/ ${pad(date.getMonth() + 1)} /${date.getFullYear()}`;
}

function applyNetMeteringXmlReplacements(xml, values) {
  const agreementPlaceLine1 = String(
    values.agreementPlaceLine1 || values.agreementCityLine1 || values.agreementPlace || 'CHHATRAPATI'
  ).trim() || 'CHHATRAPATI';
  const agreementPlaceLine2 = String(
    values.agreementPlaceLine2 || values.agreementCityLine2 || 'SAMBHAJINAGAR'
  ).trim() || 'SAMBHAJINAGAR';
  const consumerName = String(values.consumerName || values.applicantName || 'GHOGRE VENKAT LIMBRAJ').trim() || 'GHOGRE VENKAT LIMBRAJ';
  const consumerAddressParts = splitAddressParts(values.consumerAddress || values.applicantAddress, [
    values.consumerAddressLine1 || 'VENKATESH',
    values.consumerAddressLine2 || 'NIVAS, RAM',
    values.consumerAddressLine3 || 'NAGAR O BAD TQ & DIST. OSMANABAD DHARASHIV',
  ]);
  const consumerNumber = String(values.consumerNumber || '590010166383').trim() || '590010166383';
  const licenseeName = String(values.licenseeName || 'Maharashtra State Electricity Distribution Co. Ltd').trim() || 'Maharashtra State Electricity Distribution Co. Ltd';
  const licenseeOffice = String(values.licenseeOffice || values.licenseeOfficeCity || 'CHHATRAPATI SAMBHAJINAGAR').trim() || 'CHHATRAPATI SAMBHAJINAGAR';
  const capacityKw = String(values.sanctionedCapacityKw || values.capacityKw || '3').trim() || '3';
  const vendorName = String(values.vendorName || 'PARIKH RENEWABLE PRIVATE LIMITED').trim() || 'PARIKH RENEWABLE PRIVATE LIMITED';
  const witnessVendorName = String(values.witnessVendorName || vendorName).trim() || vendorName;

  const replacements = [
    { index: 8, value: agreementPlaceLine1 },
    { index: 9, value: agreementPlaceLine2 },
    { index: 10, value: `on this day of ${formatNetMeteringDate(values.agreementDate)} between the Eligible Consumer ` },
    { index: 11, value: consumerName },
    { index: 12, value: consumerAddressParts[0] || '' },
    { index: 13, value: consumerAddressParts[1] || '' },
    { index: 14, value: consumerAddressParts[2] || '' },
    { index: 16, value: 'Consumer No ' },
    { index: 17, value: consumerNumber },
    { index: 23, value: licenseeName },
    { index: 24, value: licenseeOffice },
    { index: 30, value: `${capacityKw} ` },
    { index: 31, value: 'k' },
    { index: 32, value: 'w' },
    { index: 33, value: '.' },
    { index: 87, value: witnessVendorName },
    { index: 88, value: ' for and on behalf of Eligible Consumer and ' },
    { index: 89, value: '' },
    { index: 90, value: '' },
    { index: 91, value: consumerName },
    { index: 92, value: 'for and on behalf of MSEDCL agree to this agreement.' },
  ];

  xml = replaceTextNodesByIndex(xml, replacements);
  return xml;
}

function formatUndertakingDate(value) {
  if (!value) return '05-Nov-2025';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '05-Nov-2025';

  const pad = (num) => String(num).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${pad(date.getDate())}-${monthNames[date.getMonth()]}-${date.getFullYear()}`;
}

function splitPhoneNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return ['7', '083366625'];
  if (digits.length <= 1) return [digits, ''];
  return [digits.slice(0, 1), digits.slice(1)];
}

function splitEmailAddress(value) {
  const email = String(value || 'parikhrenewable@gmail.com').trim();
  const [localPart = 'parikhrenewable', domainPart = 'gmail.com'] = email.split('@');
  return [localPart, domainPart];
}

function applyUndertakingXmlReplacements(xml, values) {
  const companyName = String(values.companyName || 'PARIKH RENEWABLE PRIVATE LIMITED').trim() || 'PARIKH RENEWABLE PRIVATE LIMITED';
  const installedCapacity = String(values.installedCapacityKw || values.sanctionedCapacityKw || '3 KW').trim() || '3 KW';
  const consumerName = String(values.consumerName || 'GHOGRE VENKAR LIMBRAJ').trim() || 'GHOGRE VENKAR LIMBRAJ';
  const location = String(values.location || values.city || 'Chhatrapati Sambhajinagar').trim() || 'Chhatrapati Sambhajinagar';
  const applicationNumber = String(values.applicationNumber || '71506411').trim() || '71506411';
  const agreementDate = formatUndertakingDate(values.agreementDate);
  const moduleCapacity = String(values.moduleCapacityWp || values.moduleWattage || '580').trim() || '580';
  const moduleCount = String(values.moduleCount || '06 Nos').trim() || '06 Nos';
  const moduleSerialNumbers = String(
    values.moduleSerialNumbers ||
      'S09259053947079, WS09259053947098, WS09259053947078, WS09259053947100, WS09259053947101, WS09259053947095'
  ).trim();
  const moduleMake = String(values.moduleMake || 'WAAREE ENERGIES LIMITED').trim() || 'WAAREE ENERGIES LIMITED';
  const cellManufacturer = String(values.cellManufacturer || moduleMake).trim() || moduleMake;
  const cellGstInvoiceNo = String(values.cellGstInvoiceNo || '').trim();
  const signatoryName = String(values.signatoryName || 'ADITYA SURESH PARIKH').trim() || 'ADITYA SURESH PARIKH';
  const signatoryDesignation = String(values.signatoryDesignation || 'DIRECTOR').trim() || 'DIRECTOR';
  const [phoneA, phoneB] = splitPhoneNumber(values.phoneNumber || '7083366625');
  const [emailLocal, emailDomain] = splitEmailAddress(values.email || 'parikhrenewable@gmail.com');

  const replacements = [
    { index: 5, value: companyName },
    { index: 7, value: installedCapacity },
    { index: 9, value: consumerName },
    { index: 11, value: location },
    { index: 13, value: applicationNumber },
    { index: 14, value: ` Dated ${agreementDate} under MSEDCL.` },
    { index: 18, value: moduleCapacity },
    { index: 19, value: '' },
    { index: 20, value: 'WP' },
    { index: 22, value: moduleCount },
    { index: 27, value: moduleSerialNumbers },
    { index: 28, value: `PV Module Make: ${moduleMake}.` },
    { index: 29, value: `Cell manufacturer's name: ${cellManufacturer}.` },
    { index: 30, value: 'Cell GST invoice No: ' },
    { index: 31, value: cellGstInvoiceNo },
    { index: 37, value: signatoryName },
    { index: 40, value: companyName },
    { index: 41, value: ` further declare that the information given above is true and correct and nothing has been concealed therein. If anything is found incorrect at any stage, then REC/MNRE may take any appropriate action against my company for wrong declaration. Supporting documents and proof of the above information will be provided as and when requested by MNRE.` },
    { index: 52, value: companyName },
    { index: 57, value: signatoryName },
    { index: 61, value: signatoryDesignation },
    { index: 65, value: phoneA },
    { index: 66, value: phoneB },
    { index: 71, value: emailLocal },
    { index: 72, value: `@${emailDomain}` },
  ];

  xml = replaceAll(xml, 'PARIKH RENEWABLE PRIVATE LIMITED', companyName);
  xml = replaceAll(xml, '3 KW', installedCapacity);
  xml = replaceAll(xml, 'GHOGARE VENKAT LIMBRAJ', consumerName);
  xml = replaceAll(xml, 'Chhatrapati Sambhajinagar', location);
  xml = replaceAll(xml, '71506411', applicationNumber);
  xml = replaceAll(xml, '05-Nov-2025', agreementDate);
  xml = replaceAll(xml, 'WAAREE ENERGIES LIMITED.', `${moduleMake}.`);
  xml = replaceAll(xml, 'DIRECTOR', signatoryDesignation);
  xml = replaceTextNodesByIndex(xml, replacements);
  return xml;
}

function getWorkCompletionXmlReplacements(values) {
  const companyName = String(values.companyName || 'PARIKH RENEWABLE PRIVATE LIMITED').trim() || 'PARIKH RENEWABLE PRIVATE LIMITED';
  const consumerName = String(values.consumerName || 'GHOGARE VENKAT LIMBRAJ').trim() || 'GHOGARE VENKAT LIMBRAJ';
  const consumerNumber = String(values.consumerNumber || '590010166383').trim() || '590010166383';
  const siteLine1 = String(values.siteAddressLine1 || 'VENKATESH').trim() || 'VENKATESH';
  const siteLine2 = String(values.siteAddressLine2 || 'NIVAS, RAM').trim() || 'NIVAS, RAM';
  const siteLine3 = String(values.siteAddressLine3 || 'NAGAR O BAD TQ & DIST. OSMANABAD').trim() || 'NAGAR O BAD TQ & DIST. OSMANABAD';
  const siteLine4 = String(values.siteAddressLine4 || 'DHARASHIV 413501').trim() || 'DHARASHIV 413501';
  const category = String(values.category || 'PRIVATE SECTOR').trim() || 'PRIVATE SECTOR';
  const sanctionNumber = String(values.sanctionNumber || '2818 / BEED (U) S/DN /').trim() || '2818 / BEED (U) S/DN /';
  const installedCapacity = String(values.installedCapacity || values.sanctionedCapacityKw || '3 KW').trim() || '3 KW';
  const capacity = String(values.capacity || '3 KW').trim() || '3 KW';
  const moduleType = String(values.moduleType || 'BIFACIAL').trim() || 'BIFACIAL';
  const moduleMake = String(values.moduleMake || 'WAAREE').trim() || 'WAAREE';
  const moduleWattage = String(values.moduleWattage || '530 WP').trim() || '530 WP';
  const moduleCount = String(values.moduleCount || '06 nos').trim() || '06 nos';
  const moduleEfficiency = String(values.moduleEfficiency || '21.68%').trim() || '21.68%';
  const moduleTotalCapacity = String(values.moduleTotalCapacity || '3180 wp').trim() || '3180 wp';
  const inverterDetails = String(values.inverterDetails || 'WAAREE & B0VS332058MA030').trim() || 'WAAREE & B0VS332058MA030';
  const inverterRating = String(values.inverterRating || '3300 watt').trim() || '3300 watt';
  const controllerType = String(values.controllerType || '1 MPPT').trim() || '1 MPPT';
  const inverterCapacity = String(values.inverterCapacity || '3.3 KW').trim() || '3.3 KW';
  const yearOfManufacture = String(values.yearOfManufacture || '2024').trim() || '2024';
  const earthingDetails = String(values.earthingDetails || 'DC:1. 7, AC :1. 7, LA :1.2').trim() || 'DC:1. 7, AC :1. 7, LA :1.2';
  const lighteningArrester = String(values.lighteningArrester || 'YES').trim() || 'YES';
  const signatoryName = String(values.signatoryName || 'ADITYA SURESH PARIKH').trim() || 'ADITYA SURESH PARIKH';
  const signatoryDesignation = String(values.signatoryDesignation || 'DIRECTOR').trim() || 'DIRECTOR';
  const warrantyText = String(
    values.warrantyText ||
      'The undersigned will provide the services to the consumers for repairs/maintenance of the RIS plant free of cost for 5 years of the comprehensive Maintenance Contract (CMC) period from the date of commissioning of the plant. Non performing/under-performing system component will be replaced Repaired free of cost in the CMC period.'
  ).trim();
  const identityName = String(values.identityName || consumerName).trim() || consumerName;
  const identityAddress = String(values.identityAddress || `${siteLine1} ${siteLine2} ${siteLine3} ${siteLine4}`).trim();
  const identityAadhar = String(values.identityAadhar || '').trim();

  const replacements = [
    { index: 1, value: 'Work Completion Report for Solar Power Plant' },
    { index: 7, value: consumerName },
    { index: 10, value: consumerNumber },
    { index: 15, value: siteLine1 },
    { index: 16, value: siteLine2 },
    { index: 17, value: siteLine3 },
    { index: 18, value: siteLine4 },
    { index: 21, value: category },
    { index: 24, value: sanctionNumber },
    { index: 27, value: installedCapacity },
    { index: 29, value: capacity },
    { index: 33, value: moduleType },
    { index: 35, value: moduleMake },
    { index: 37, value: moduleWattage },
    { index: 39, value: moduleCount },
    { index: 41, value: moduleEfficiency },
    { index: 43, value: moduleTotalCapacity },
    { index: 47, value: inverterDetails },
    { index: 49, value: inverterRating },
    { index: 51, value: controllerType },
    { index: 53, value: inverterCapacity },
    { index: 55, value: yearOfManufacture },
    { index: 59, value: 'DC:1.' },
    { index: 60, value: '7, AC' },
    { index: 61, value: ':1.' },
    { index: 62, value: '7, LA' },
    { index: 63, value: ':1.2' },
    { index: 67, value: 'We' },
    { index: 68, value: companyName },
    { index: 70, value: `& ${consumerName}` },
    { index: 72, value: consumerNumber },
    { index: 78, value: 'Guarantee Certificate Undertaking to be submitted by VENDOR' },
    { index: 79, value: warrantyText },
    { index: 81, value: 'Signature [Vendor]' },
    { index: 82, value: 'Stamp & Seal' },
    { index: 84, value: identityName },
    { index: 87, value: identityAddress },
    { index: 88, value: identityAadhar },
    { index: 89, value: '' },
    { index: 90, value: '' },
    { index: 91, value: 'Address.' },
    { index: 92, value: identityAddress },
    { index: 93, value: '' },
    { index: 94, value: '' },
    { index: 95, value: '' },
    { index: 96, value: '' },
    { index: 97, value: '' },
    { index: 98, value: '' },
    { index: 99, value: '' },
    { index: 100, value: '' },
    { index: 101, value: '' },
    { index: 102, value: '' },
    { index: 103, value: '' },
    { index: 104, value: '' },
    { index: 105, value: '' },
    { index: 106, value: '' },
    { index: 107, value: '' },
  ];

  return replacements;
}

function applyWorkCompletionXmlReplacements(xml, values) {
  return replaceTextNodesByIndex(xml, getWorkCompletionXmlReplacements(values));
}

async function createDocxFromTemplate(templatePath, values) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'annexure-docx-'));
  try {
    const extractedDir = await extractTemplate(templatePath, tempRoot);
    const documentXmlPath = path.join(extractedDir, 'word', 'document.xml');

    let documentXml = fs.readFileSync(documentXmlPath, 'utf8');
    documentXml = applyDocumentXmlReplacements(documentXml, values);
    fs.writeFileSync(documentXmlPath, documentXml, 'utf8');

    const archivePath = path.join(tempRoot, 'annexure-output.docx');
    const archiveZipPath = path.join(tempRoot, 'annexure-output.zip');
    const psCommand = [
      `$ErrorActionPreference = 'Stop';`,
      `if (Test-Path '${archiveZipPath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -Force }`,
      `Compress-Archive -Path '${extractedDir.replace(/'/g, "''")}\\*' -DestinationPath '${archiveZipPath.replace(/'/g, "''")}' -Force`,
      `if (Test-Path '${archivePath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archivePath.replace(/'/g, "''")}' -Force }`,
      `Rename-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -NewName '${path.basename(archivePath).replace(/'/g, "''")}'`,
    ].join('; ');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psCommand], { stdio: 'ignore' });

    return fs.readFileSync(archivePath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function createModelAgreementDocxFromTemplate(templatePath, values) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'model-agreement-docx-'));
  try {
    const extractedDir = await extractTemplate(templatePath, tempRoot);
    const documentXmlPath = path.join(extractedDir, 'word', 'document.xml');

    let documentXml = fs.readFileSync(documentXmlPath, 'utf8');
    documentXml = applyModelAgreementXmlReplacements(documentXml, values);
    fs.writeFileSync(documentXmlPath, documentXml, 'utf8');

    const archivePath = path.join(tempRoot, 'model-agreement-output.docx');
    const archiveZipPath = path.join(tempRoot, 'model-agreement-output.zip');
    const psCommand = [
      `$ErrorActionPreference = 'Stop';`,
      `if (Test-Path '${archiveZipPath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -Force }`,
      `Compress-Archive -Path '${extractedDir.replace(/'/g, "''")}\\*' -DestinationPath '${archiveZipPath.replace(/'/g, "''")}' -Force`,
      `if (Test-Path '${archivePath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archivePath.replace(/'/g, "''")}' -Force }`,
      `Rename-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -NewName '${path.basename(archivePath).replace(/'/g, "''")}'`,
    ].join('; ');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psCommand], { stdio: 'ignore' });

    return fs.readFileSync(archivePath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function createNetMeteringDocxFromTemplate(templatePath, values) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'net-metering-docx-'));
  try {
    const extractedDir = await extractTemplate(templatePath, tempRoot);
    const documentXmlPath = path.join(extractedDir, 'word', 'document.xml');

    let documentXml = fs.readFileSync(documentXmlPath, 'utf8');
    documentXml = applyNetMeteringXmlReplacements(documentXml, values);
    fs.writeFileSync(documentXmlPath, documentXml, 'utf8');

    const archivePath = path.join(tempRoot, 'net-metering-output.docx');
    const archiveZipPath = path.join(tempRoot, 'net-metering-output.zip');
    const psCommand = [
      `$ErrorActionPreference = 'Stop';`,
      `if (Test-Path '${archiveZipPath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -Force }`,
      `Compress-Archive -Path '${extractedDir.replace(/'/g, "''")}\\*' -DestinationPath '${archiveZipPath.replace(/'/g, "''")}' -Force`,
      `if (Test-Path '${archivePath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archivePath.replace(/'/g, "''")}' -Force }`,
      `Rename-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -NewName '${path.basename(archivePath).replace(/'/g, "''")}'`,
    ].join('; ');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psCommand], { stdio: 'ignore' });

    return fs.readFileSync(archivePath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function createUndertakingDocxFromTemplate(templatePath, values) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'undertaking-docx-'));
  try {
    const extractedDir = await extractTemplate(templatePath, tempRoot);
    const documentXmlPath = path.join(extractedDir, 'word', 'document.xml');

    let documentXml = fs.readFileSync(documentXmlPath, 'utf8');
    documentXml = applyUndertakingXmlReplacements(documentXml, values);
    fs.writeFileSync(documentXmlPath, documentXml, 'utf8');

    const archivePath = path.join(tempRoot, 'undertaking-output.docx');
    const archiveZipPath = path.join(tempRoot, 'undertaking-output.zip');
    const psCommand = [
      `$ErrorActionPreference = 'Stop';`,
      `if (Test-Path '${archiveZipPath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -Force }`,
      `Compress-Archive -Path '${extractedDir.replace(/'/g, "''")}\\*' -DestinationPath '${archiveZipPath.replace(/'/g, "''")}' -Force`,
      `if (Test-Path '${archivePath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archivePath.replace(/'/g, "''")}' -Force }`,
      `Rename-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -NewName '${path.basename(archivePath).replace(/'/g, "''")}'`,
    ].join('; ');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psCommand], { stdio: 'ignore' });

    return fs.readFileSync(archivePath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function createWorkCompletionDocxFromTemplate(templatePath, values) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'work-completion-docx-'));
  try {
    const extractedDir = await extractTemplate(templatePath, tempRoot);
    const documentXmlPath = path.join(extractedDir, 'word', 'document.xml');
    const replacementsJson = JSON.stringify(getWorkCompletionXmlReplacements(values)).replace(/'/g, "''");

    const psUpdateCommand = [
      `$ErrorActionPreference = 'Stop';`,
      `$xml = [xml](Get-Content -LiteralPath '${documentXmlPath.replace(/'/g, "''")}');`,
      `$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable);`,
      `$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main');`,
      `$nodes = $xml.SelectNodes('//w:t', $ns);`,
      `$replacements = ConvertFrom-Json -InputObject '${replacementsJson}';`,
      `foreach ($item in $replacements) {`,
      `  $index = [int]$item.index;`,
      `  if ($index -ge 1 -and $index -le $nodes.Count) {`,
      `    $nodes.Item($index - 1).InnerText = [string]$item.value;`,
      `  }`,
      `}`,
      `$xml.Save('${documentXmlPath.replace(/'/g, "''")}');`,
    ].join(' ');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psUpdateCommand], { stdio: 'ignore' });

    const archivePath = path.join(tempRoot, 'work-completion-output.docx');
    const archiveZipPath = path.join(tempRoot, 'work-completion-output.zip');
    const psCommand = [
      `$ErrorActionPreference = 'Stop';`,
      `if (Test-Path '${archiveZipPath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -Force }`,
      `Compress-Archive -Path '${extractedDir.replace(/'/g, "''")}\\*' -DestinationPath '${archiveZipPath.replace(/'/g, "''")}' -Force`,
      `if (Test-Path '${archivePath.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${archivePath.replace(/'/g, "''")}' -Force }`,
      `Rename-Item -LiteralPath '${archiveZipPath.replace(/'/g, "''")}' -NewName '${path.basename(archivePath).replace(/'/g, "''")}'`,
    ].join('; ');
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psCommand], { stdio: 'ignore' });

    return fs.readFileSync(archivePath);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

module.exports = {
  createDocxFromTemplate,
  createModelAgreementDocxFromTemplate,
  createNetMeteringDocxFromTemplate,
  createUndertakingDocxFromTemplate,
  createWorkCompletionDocxFromTemplate,
  resolveTemplatePath,
  resolveModelAgreementTemplatePath,
  resolveNetMeteringTemplatePath,
  resolveUndertakingTemplatePath,
  resolveWorkCompletionTemplatePath,
  formatDate,
};
