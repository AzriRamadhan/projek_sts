import express, { type Request, type Response } from 'express';
import { z } from 'zod';
import connection from './db/index';

const app = express();
const port = 3000;

const postSchema = z.object({
  judul: z.string().min(1, 'Judul wajib diisi'),
  isi: z.string().min(1, 'Isi wajib diisi'),
  penulis: z.string().min(1, 'Penulis wajib diisi'),
  kategori_id: z.number().int().positive().nullable().optional(),
});

app.use(express.json());
 
app.use((_request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (_request: Request, response: Response) => {
  response.json({ message: 'API is running' });
});

app.get('/api/post', async (_request: Request, response: Response) => {
  const [rows] = await connection.query(
    'SELECT p.*, k.nama AS nama_kategori FROM post p LEFT JOIN kategori k ON p.kategori_id = k.id ORDER BY p.id DESC'
  );
  response.json({ message: 'Semua post berhasil diambil', data: rows });
});

app.get('/api/post/:id', async (request: Request, response: Response) => {
  const [rows]: any = await connection.query(
    'SELECT p.*, k.nama AS nama_kategori FROM post p LEFT JOIN kategori k ON p.kategori_id = k.id WHERE p.id = ?',
    [request.params.id]
  );
  if (rows.length === 0) {
    response.status(404).json({ message: 'Post tidak ditemukan' });
    return;
  }
  response.json({ message: 'Post ditemukan', data: rows[0] });
});

app.post('/api/post', async (request: Request, response: Response) => {
  const result = postSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({
      message: 'Data tidak valid',
      error: result.error.issues,
    });
    return;
  }

  const { judul, isi, penulis, kategori_id } = result.data;

  const [insertResult]: any = await connection.query(
    'INSERT INTO post (judul, isi, penulis, kategori_id) VALUES (?, ?, ?, ?)',
    [judul, isi, penulis, kategori_id ?? null]
  );
  response.status(201).json({ message: 'Post berhasil ditambahkan', id: insertResult.insertId });
});

app.put('/api/post/:id', async (request: Request, response: Response) => {
  const result = postSchema.safeParse(request.body);

  if (!result.success) {
    response.status(400).json({
      message: 'Data tidak valid',
      error: result.error.issues,
    });
    return;
  }

  const { judul, isi, penulis, kategori_id } = result.data;

  const [updateResult]: any = await connection.query(
    'UPDATE post SET judul = ?, isi = ?, penulis = ?, kategori_id = ? WHERE id = ?',
    [judul, isi, penulis, kategori_id ?? null, request.params.id]
  );
  if (updateResult.affectedRows === 0) {
    response.status(404).json({ message: 'Post tidak ditemukan' });
    return;
  }
  response.json({ message: 'Post berhasil diupdate' });
});

app.delete('/api/post/:id', async (request: Request, response: Response) => {
  const [result]: any = await connection.query(
    'DELETE FROM post WHERE id = ?',
    [request.params.id]
  );
  if (result.affectedRows === 0) {
    response.status(404).json({ message: 'Post tidak ditemukan' });
    return;
  }
  response.json({ message: 'Post berhasil dihapus' });
});

app.get('/api/kategori', async (_request: Request, response: Response) => {
  const [rows] = await connection.query('SELECT * FROM kategori ORDER BY id DESC');
  response.json({ message: 'Semua kategori berhasil diambil', data: rows });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});