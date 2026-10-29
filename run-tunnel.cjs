const localtunnel = require('localtunnel');

async function start() {
  console.log('Đang khởi tạo đường link toàn cầu...');
  try {
    const tunnel = await localtunnel({ port: 5173 });
    console.log('PUBLIC_URL:' + tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel bị đóng, đang tự động kết nối lại...');
      setTimeout(start, 2000);
    });

    tunnel.on('error', (err) => {
      console.error('Lỗi tunnel:', err);
      setTimeout(start, 3000);
    });
  } catch (err) {
    console.error('Không thể mở tunnel, thử lại sau 3s...', err);
    setTimeout(start, 3000);
  }
}

start();

// Giữ process luôn sống
setInterval(() => {}, 1000 * 60 * 60);
