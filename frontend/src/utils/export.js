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
  } else if (filename === 'planner') {
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
      'Activities Planned': r.plan_of_activity || ''
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
