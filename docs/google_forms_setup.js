/**
 * RS Bridge Consultancy — Google Forms & Sheets Auto-Generator
 * 
 * Instructions:
 * 1. Open Google Drive (https://drive.google.com)
 * 2. Click "+ New" -> "More" -> "Google Apps Script"
 * 3. Paste this entire code into script editor and click "Run" -> "createRSBridgeForms"
 * 4. Two Google Forms (Candidate & Company) will be automatically created in your Google Drive!
 */

function createRSBridgeForms() {
  createCandidateForm();
  createCompanyForm();
}

function createCandidateForm() {
  var form = FormApp.create('RS Bridge Consultancy — Candidate Intake Form');
  form.setDescription('Submit your details and CV for job opportunities across Delhi, Noida, Greater Noida, and Ghaziabad.\n\nNote: Our services are 100% FREE for candidates. We are paid by hiring companies only.');

  form.addTextItem().setTitle('1. Full Name').setRequired(true);
  form.addTextItem().setTitle('2. Mobile Number (WhatsApp preferred)').setRequired(true);
  form.addTextItem().setTitle('3. Email Address').setRequired(true);
  form.addTextItem().setTitle('4. Current Location (City)').setRequired(true);

  var exp = form.addMultipleChoiceItem();
  exp.setTitle('5. Work Experience Level')
     .setChoices([
       exp.createChoice('Fresher (0 years)'),
       exp.createChoice('0 - 2 years'),
       exp.createChoice('2 - 5 years'),
       exp.createChoice('5+ years')
     ])
     .setRequired(true);

  var cat = form.addMultipleChoiceItem();
  cat.setTitle('6. Hiring Field / Industry')
     .setChoices([
       cat.createChoice('IT & Technical'),
       cat.createChoice('Sales & Marketing'),
       cat.createChoice('BPO & Customer Support'),
       cat.createChoice('Back Office & Administration'),
       cat.createChoice('Permanent Recruitment'),
       cat.createChoice('Bulk Hiring')
     ])
     .setRequired(true);

  form.addTextItem().setTitle('7. Preferred Job Location');
  form.addTextItem().setTitle('8. Highest Qualification (e.g. B.Tech, MBA, 12th)');
  form.addTextItem().setTitle('9. Current / Last Company & Position (if any)');
  form.addTextItem().setTitle('10. Expected Salary (e.g. 3-4 LPA)');
  form.addTextItem().setTitle('11. Notice Period (e.g. Immediate, 15 days, 30 days)');

  Logger.log('Candidate Form Created: ' + form.getEditUrl());
}

function createCompanyForm() {
  var form = FormApp.create('RS Bridge Consultancy — Hiring Requirement Form');
  form.setDescription('Share your hiring requirement with RS Bridge Consultancy. We will source, screen, and shortlist suitable candidates according to your specifications.');

  form.addTextItem().setTitle('1. Company Name').setRequired(true);
  form.addTextItem().setTitle('2. Contact Person Name').setRequired(true);
  form.addTextItem().setTitle('3. Designation').setRequired(false);
  form.addTextItem().setTitle('4. Mobile Number').setRequired(true);
  form.addTextItem().setTitle('5. Email Address').setRequired(true);
  form.addTextItem().setTitle('6. Office Location / City').setRequired(true);
  form.addTextItem().setTitle('7. Job Position / Title').setRequired(true);
  form.addTextItem().setTitle('8. Number of Vacancies').setRequired(true);

  var cat = form.addMultipleChoiceItem();
  cat.setTitle('9. Hiring Line / Category')
     .setChoices([
       cat.createChoice('IT & Technical'),
       cat.createChoice('Sales & Marketing'),
       cat.createChoice('BPO & Customer Support'),
       cat.createChoice('Back Office & Administration'),
       cat.createChoice('Permanent Recruitment'),
       cat.createChoice('Bulk Hiring')
     ])
     .setRequired(true);

  form.addTextItem().setTitle('10. Experience Required (e.g. 1-3 years)');
  form.addTextItem().setTitle('11. Salary Range Offered (e.g. 4-6 LPA)');
  form.addParagraphTextItem().setTitle('12. Brief Job Description / Key Responsibilities');
  form.addTextItem().setTitle('13. Expected Joining Timeline');

  Logger.log('Company Form Created: ' + form.getEditUrl());
}
