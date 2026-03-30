import * as XLSX from 'xlsx';

const fmtExcelDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return '';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
};

export const exportToExcel = (data, filename = 'export') => {
  if (!data || !data.length) return;

  let rows;
  if (filename === 'master') {
    rows = data.map((r, i) => ({
      '#': i + 1,
      'Region': r.region,
      'Head Count': parseInt(r.head_count) || 0,
      'Birthday Budget/Head (₹)': parseFloat(r.birthday_budget_per_head) || 0,
      'Birthday Events': parseInt(r.birthday_events) || 0,
      'Festival Budget/Head (₹)': parseFloat(r.festival_budget_per_head) || 0,
      'Festival Events': parseInt(r.festival_events) || 0,
      'Birthday Amount (₹)': parseFloat(r.birthday_amount) || 0,
      'Festival Amount (₹)': parseFloat(r.festival_amount) || 0,
      'Total Amount (₹)': parseFloat(r.total_amount) || 0,
      'Date Created': fmtExcelDate(r.created_at)
    }));
  } else if (filename === 'planner' || filename === 'planner_vs_poster' || filename === 'planned_vs_scheduled') {
    rows = data.map((r, i) => ({
      '#': i + 1,
      'Region': r.region || '',
      'Event': r.event_type || '',
      'Event Type': r.event_category || '',
      'Event Name': r.event_name || '',
      'Event Date': fmtExcelDate(r.event_date),
      'Timing': r.timing || '',
      'Mode': r.mode || '',
      'Meeting Link': r.meeting_link || '',
      'HR SPOC': r.hr_spoc || '',
      'Mode of Content': r.content_mode || '',
      'Mail to Employees Date': fmtExcelDate(r.mail_to_employees),
      'Poster Required Date': fmtExcelDate(r.poster_required_date),
      'No of Posters/Emails': r.no_of_posters_emails ?? '',
      'Requirement to Marketing': r.requirement_to_marketing || '',
      'Activities Planned': r.plan_of_activity || '',
      ...(filename === 'planner_vs_poster' ? { 'Poster Uploaded': r.has_posters ? 'Yes' : 'No' } : {}),
      ...(filename === 'planned_vs_scheduled' ? { 'Scheduled': r.is_scheduled ? 'Yes' : 'No' } : {})
    }));
  } else if (filename === 'planned_vs_actual') {
    rows = data.map((r, i) => ({
      '#': i + 1,
      'Region': r.region || '',
      'Event Name': r.event_name || '',
      'Event Date': fmtExcelDate(r.event_date),
      'Actual Date': fmtExcelDate(r.actual_date),
      'Actual Time': r.actual_time || '',
      'Participants': r.num_participants ?? '',
      'Amount Spent (₹)': parseFloat(r.amount_spent) || 0,
      'Documents Count': (r.supporting_docs || []).length
    }));
  } else if (filename === 'budget_utilisation') {
    rows = data.map((r, i) => ({
      '#': i + 1,
      'Region': r.region || '',
      'Total Budget (₹)': parseFloat(r.total_amount) || 0,
      'Utilised Amount (₹)': parseFloat(r.utilised_amount) || 0,
      'Balance Amount (₹)': parseFloat(r.balance_amount) || 0,
      'Utilisation %': r.total_amount > 0 ? ((r.utilised_amount / r.total_amount) * 100).toFixed(2) + '%' : '0%'
    }));
  } else if (filename === 'reports') {
    rows = data.map((r, i) => ({
      '#': i + 1,
      'Region': r.region || '',
      'Event Type': r.event_type || '',
      'Event Name': r.event_name || '',
      'Planned Date': fmtExcelDate(r.event_date),
      'Actual Date': fmtExcelDate(r.actual_date),
      'Participants': r.num_participants ?? '',
      'Amount Spent (₹)': parseFloat(r.amount_spent) || 0
    }));
  } else if (filename === 'scheduled_mails') {
    rows = data.map((r, i) => ({
      '#': i + 1,
      'Recipient (To)': r.to || '',
      'Subject': r.subject || '',
      'Mail Date': fmtExcelDate(r.date),
      'Mail Time': r.time || '',
      'Events': (r.events || []).map(e => e.event_name).join(', '),
      'Email Content': r.email_content || ''
    }));
  } else {
    rows = data;
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  wb.Props = { Title: filename, CreatedDate: new Date() };
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0,10)}.xlsx`, { bookType: 'xlsx', type: 'binary' });
};
