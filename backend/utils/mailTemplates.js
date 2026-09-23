export const newClientTemplate = (client, memberId) => `
  <h2>Welcome to Elite Fitness 💪</h2>
  <p>Hi ${client},</p>
  <p>Your membership has been successfully created.</p>
  <p><b>Member ID:</b> ${memberId}</p>
  <p>We’re excited to have you with us!</p>
`;

export const renewalTemplate = (client, endDate) => `
  <h2>Membership Renewed ✅</h2>
  <p>Hi ${client},</p>
  <p>Your membership has been renewed successfully.</p>
  <p><b>Valid till:</b> ${endDate}</p>
`;

export const birthdayTemplate = (client) => `
  <h2>🎉 Happy Birthday ${client}!</h2>
  <p>Wishing you a year full of health, strength, and success.</p>
  <p>– Elite Fitness Team 💪</p>
`;

export const anniversaryTemplate = (client) => `
  <h2>🎊 Happy Anniversary!</h2>
  <p>Dear ${client},</p>
  <p>Thank you for being part of Elite Fitness.</p>
  <p>We truly value your journey with us 💙</p>
`;
