const express = require('express');
const multer = require('multer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const PDFMerger = require('pdf-merger-js').default;
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, 'public')));


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}


app.use('/uploads', express.static(uploadsDir));

const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('textfile'), (req, res) => {
  if (!req.file) return res.status(400).send('No file detected');

  const text = fs.readFileSync(req.file.path, 'utf-8');
  const pdfPath = path.join('uploads', `${req.file.filename}.pdf`);

  const doc = new PDFDocument();
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);
  doc.text(text);
  doc.end();

  stream.on('finish', () => {
    res.json({ pdfPath: `http://localhost:3000/${pdfPath}` });
  });

  stream.on('error', (err) => {
    console.error('Error writing PDF:', err);
    res.status(500).send('Error creating PDF');
  });
});


app.post('/merge', upload.array('pdfs', 5), async (req, res) => {
  try {
    const merger = new PDFMerger();
    for (const file of req.files) {
      await merger.add(file.path);
    }

    const mergedPdfPath = path.join('uploads', 'merged.pdf');
    await merger.save(mergedPdfPath);

    res.json({ mergedPdfPath: `http://localhost:3000/${mergedPdfPath}` });
  } catch (error) {
    console.error('Error merging PDFs:', error);
    res.status(500).send('Error merging PDFs');
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));