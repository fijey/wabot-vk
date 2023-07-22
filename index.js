const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    DisconnectReason,
  } = require('@whiskeysockets/baileys');
  const { Boom } = require('@hapi/boom');
  const fs = require('fs');
  
  // fungsi utama vk wa bot
  async function connectToWhatsapp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const logger = console; // Ganti dengan logger sesuai kebutuhan Anda
  
  
    // buat sebuah koneksi ke whatsapp
    const sock = makeWASocket({
      printQRInTerminal: true,
      auth: state,
      defaultQueryTimeoutMs: undefined,
      rejectUnauthorized: false,
    });
  
    // Listen For Connection Update (mantau)
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        // console.log('Koneksi Terputus', lastDisconnect?.error, 'Hubungkan kembali', shouldReconnect);
  
        if (shouldReconnect) {
          connectToWhatsapp();
        }
      }
      if (connection === 'open') {
        console.log('koneksi dibuka');
      }
    });
  
    sock.ev.on('creds.update', saveCreds);
  
    // fungsi untuk memantau pesan masuk;
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      console.log('Tipe pesan:', type);
      console.log(messages);
      if (type === 'notify') {
        try {
            // dapatkan nomor pengirim 
            const senderNumber = messages[0].key.remoteJid;
            let incomingMessages = messages[0].message.conversation.toLocaleLowerCase();
            console.log('nomor sender ', senderNumber);
            console.log('incoming ', incomingMessages);

            //jika ada yang mengirim pesan halo vk

            if(incomingMessages === "halo vk"){
                await sock.sendMessage(
                    senderNumber,
                    {text: "Halo Brother"},
                    {quoted:0},
                    5000
                    )
            }

            if(incomingMessages.includes('lihat komisi')){
                await sock.sendMessage(
                    senderNumber,
                    {text: "Berikut adalah List Komisi dari VK"},
                    {quoted:0},
                    5000
                    )
            }

        } catch (error) {
            console.log("Error ",error);
        }
      }
    });
  
    // Tambahkan event handler untuk menerima pesan masuk
    sock.ev.on('message', async (message) => {
      // Cek apakah pesan berasal dari pengguna lain (bukan dari diri sendiri)
      if (!message.key.fromMe) {
        console.log('Menerima pesan baru:', message.message);
  
        // Balas pesan dengan pesan "Halo juga!"
        const reply = new MessageContent('text', { text: 'Halo juga!' });
        await sock.sendMessage(message.key.remoteJid, reply);
      }
    });
  
  }
  
  connectToWhatsapp().catch((err) => {
    console.log('ADA ERROR', err);
  });
  