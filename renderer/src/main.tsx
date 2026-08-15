import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Demo seed for UI verification only — skip when not needed
if (location.search.includes('seed=1')) {
  const seed = async () => {
    const acc = await window.smtpApi.list();
    if (!acc.length) {
      await window.smtpApi.save([{ id: 'demo1', name: 'Demo', host: 'smtp.gmail.com', port: '465', tls: true, user: 'demo@example.com', pass: 'xxxx', fromName: 'Demo User', fromEmail: 'demo@example.com' }], 'demo1');
    }
    await window.draftsApi.save([{ id: 'd1', to: 'ban@example.com', cc: [], bcc: [], subject: 'Báo cáo tuần', bodyHtml: '<h2>Tiêu đề chính</h2><p>Nội dung <b>in đậm</b>, <i>nghiêng</i> với màu <span style="color:#C9913B">vàng gold</span>.</p><ul><li>Mục 1</li><li>Mục 2</li></ul>', attachments: [], updatedAt: Date.now() }]);
    await window.templatesApi.save([{ id: 't1', name: 'Chào hỏi khách hàng', bodyHtml: '<p>Kính gửi quý khách,</p><p>Cảm ơn bạn đã quan tâm đến sản phẩm của chúng tôi.</p><p>Trân trọng.</p>' }]);
    await window.sentApi.save([{ id: 's1', account: { fromName: 'Demo User', fromEmail: 'demo@example.com' }, to: 'khach@example.com', subject: 'Thư mẫu đã gửi', html: '<p>Xin chào, đây là nội dung thư mẫu.</p>', attachments: [], date: Date.now() }]);
  };
  seed();
}
import './global.css';

createRoot(document.getElementById('root')!).render(<App />);
