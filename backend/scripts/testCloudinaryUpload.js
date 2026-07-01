require('dotenv').config();

const http = require('http');
const { Blob } = require('buffer');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const cloudinary = require('../config/cloudinary');

const withTimeout = async (promise, label, ms = 45000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label} timed out`)), ms);

  try {
    return await promise(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

const startServer = async () => {
  const app = require('../app');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    server,
    baseUrl: `http://127.0.0.1:${server.address().port}/api`
  };
};

const main = async () => {
  if (!cloudinary.isConfigured()) {
    throw new Error(`Cloudinary missing config: ${cloudinary.getMissingConfig().join(', ')}`);
  }

  await connectDatabase();

  const { server, baseUrl } = await startServer();

  try {
    const email = `codex.upload.${Date.now()}@example.com`;

    const signupResponse = await withTimeout((signal) => fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Codex Upload Test',
        email,
        password: 'Password123!'
      })
    }), 'Signup request');
    const signup = await signupResponse.json();

    if (!signupResponse.ok || !signup.token) {
      throw new Error(`Signup failed (${signupResponse.status}): ${JSON.stringify(signup)}`);
    }

    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
      'base64'
    );
    const formData = new FormData();
    formData.append('category', 'general');
    formData.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'cloudinary-test.png');

    const uploadResponse = await withTimeout((signal) => fetch(`${baseUrl}/upload`, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${signup.token}`
      },
      body: formData
    }), 'Upload request');
    const upload = await uploadResponse.json();

    if (!uploadResponse.ok || !upload.success) {
      throw new Error(`Upload failed (${uploadResponse.status}): ${JSON.stringify(upload)}`);
    }

    const getResponse = await withTimeout((signal) => fetch(`${baseUrl}/image/${upload.image.id}`, {
      signal
    }), 'Image fetch request');
    const image = await getResponse.json();

    if (!getResponse.ok || image.id !== upload.image.id) {
      throw new Error(`Image fetch failed (${getResponse.status}): ${JSON.stringify(image)}`);
    }

    console.log(JSON.stringify({
      success: true,
      uploadStatus: uploadResponse.status,
      fetchStatus: getResponse.status,
      imageId: upload.image.id,
      imageUrl: upload.imageUrl,
      publicId: upload.image.publicId,
      width: upload.image.width,
      height: upload.image.height,
      imageSize: upload.image.imageSize
    }, null, 2));
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase();
  }
};

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error.message);
    try {
      await disconnectDatabase();
    } catch (disconnectError) {
      // Ignore disconnect errors during test shutdown.
    }
    process.exit(1);
  });
