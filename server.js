const express = require('express');
const db = require('./database');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/notes', (req, res) => {
    db.all(`SELECT * FROM notes`, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Заметки не найдены' });
        }
        res.status(200).json(rows);
    });
});

app.get('/note/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM notes WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Заметка не найдена' });
        }
        res.status(200).json(row);
    });
});

app.get('/note/read/:title', (req, res) => {
    const { title } = req.params;
    db.get(`SELECT * FROM notes WHERE title = ?`, [title], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        if (!row) {
            return res.status(404).json({ message: 'Заметка не найдена' });
        }
        res.status(200).json(row);
    });
});

app.post('/note', (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: 'Title и content обязательны' });
    }

    const created = new Date().toISOString();
    db.run(
        `INSERT INTO notes (title, content, created, changed) VALUES (?, ?, ?, ?)`,
        [title, content, created, created],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Заметка с таким title уже существует' });
                }
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }
            res.status(201).json({ id: this.lastID, title, content, created, changed: created });
        }
    );
});

app.delete('/note/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM notes WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        if (this.changes === 0) {
            return res.status(409).json({ message: 'Заметка не найдена' });
        }
        res.status(204).send();
    });
});

app.put('/note/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title и content обязательны' });
    }

    const changed = new Date().toISOString();
    db.run(
        `UPDATE notes SET title = ?, content = ?, changed = ? WHERE id = ?`,
        [title, content, changed, id],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Заметка с таким title уже существует' });
                }
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }
            if (this.changes === 0) {
                return res.status(409).json({ message: 'Заметка не найдена' });
            }
            res.status(204).send();
        }
    );
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
