import QRCode from 'qrcode';

export async function generateQRCode(text: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: 300,
      margin: 2,
    });
    return svg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}