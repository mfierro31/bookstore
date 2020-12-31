process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

let book;
let incompleteBook;
let wrongTypeBook;

let b1;
let b2;

describe("Book routes test", () => {
  beforeEach(async () => {
    await db.query('DELETE FROM books');

    b1 = await Book.create({
      isbn: "0691161518",
      amazon_url: "http://a.co/eobPtX2",
      author: "Matthew Lane",
      language: "english",
      pages: 264,
      publisher: "Princeton University Press",
      title: "Power-Up: Unlocking the Hidden Mathematics in Video Games",
      year: 2017
    });

    b2 = await Book.create({
      isbn: "0691161519",
      amazon_url: "https://www.amazon.com/Fahrenheit-451-Ray-Bradbury/dp/1451673310",
      author: "Ray Bradbury",
      language: "english",
      pages: 256,
      publisher: "Ballantine Books",
      title: "Fahrenheit 451",
      year: 1953
    });

    book = {
      isbn: "01234567890",
      amazon_url: "http://a.co/eobPtX2",
      author: "Tony Kushner",
      language: "english",
      pages: 103,
      publisher: "American Theatre Company",
      title: "Angels In America",
      year: 1991
    };

    incompleteBook = {
      isbn: "01234567890",
      amazon_url: "http://a.co/eobPtX2",
      author: "Tony Kushner",
      language: "english",
      pages: 103,
      publisher: "American Theatre Company"
    };

    wrongTypeBook = {
      isbn: 1234567890,
      amazon_url: true,
      author: "Tony Kushner",
      language: "english",
      pages: 103,
      publisher: "American Theatre Company",
      title: "Angels In America",
      year: 1991
    };
  });

  describe("GET /", () => {
    test("Get all books in database", async () => {
      const res = await request(app).get('/books');

      expect(res.statusCode).toBe(200);
      // Ordered by title, so b2 has to go before b1
      expect(res.body).toEqual({ books: [b2, b1] });
    });
  });

  describe("GET /:isbn", () => {
    test("Get a book by its isbn", async () => {
      const res = await request(app).get(`/books/${b2.isbn}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ book: b2 });
    });

    test("Get a 404 error if isbn doesn't exist", async () => {
      const res = await request(app).get('/books/0');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toEqual("There is no book with an isbn '0'");
    });
  });

  describe("POST /", () => {
    test("Create a new book", async () => {
      const res = await request(app).post(`/books`).send(book);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual({ book });
    });

    test("Get a 400 error if all info isn't sent", async () => {
      const res = await request(app).post('/books').send(incompleteBook);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual([`instance requires property "title"`, `instance requires property "year"`]);
    });

    test("Get a 400 error if some info isn't right type", async () => {
      const res = await request(app).post('/books').send(wrongTypeBook);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual([`instance.isbn is not of a type(s) string`, `instance.amazon_url is not of a type(s) string`]);
    });

    test("Get a 400 error if we send nothing", async () => {
      const res = await request(app).post('/books');

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual([
        `instance requires property "isbn"`,
        `instance requires property "amazon_url"`,
        `instance requires property "author"`,
        `instance requires property "language"`,
        `instance requires property "pages"`,
        `instance requires property "publisher"`,
        `instance requires property "title"`,
        `instance requires property "year"`
      ]);
    });
  });

  describe("PUT /:isbn", () => {
    test("Update an existing book with all info", async () => {
      // Have to change the isbn here, not because it matters when we send it in the put request below, but when we pass it
      // in to the .toEqual part below
      book.isbn = b2.isbn;
      
      const res = await request(app).put(`/books/${b2.isbn}`).send(book);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ book });
    });

    test("Update an existing book with only some info", async () => {      
      const res = await request(app).put(`/books/${b2.isbn}`).send({ author: "Ray Brad", language: "german" });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ 
        book: {
          isbn: "0691161519",
          amazon_url: "https://www.amazon.com/Fahrenheit-451-Ray-Bradbury/dp/1451673310",
          author: "Ray Brad",
          language: "german",
          pages: 256,
          publisher: "Ballantine Books",
          title: "Fahrenheit 451",
          year: 1953
        }
       });
    });

    test("Get a 400 error if some info isn't right type", async () => {
      const res = await request(app).put(`/books/${b2.isbn}`).send(wrongTypeBook);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual([`instance.amazon_url is not of a type(s) string`]);
    });

    test("Get a 400 error if we send nothing", async () => {
      const res = await request(app).put(`/books/${b2.isbn}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual([
        `instance is not any of [subschema 0],[subschema 1],[subschema 2],[subschema 3],[subschema 4],[subschema 5],[subschema 6]`
      ]);
    });
  });

  describe("DELETE /:isbn", () => {
    test("Delete a book by isbn", async () => {
      const res = await request(app).delete(`/books/${b1.isbn}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ message: "Book deleted" });
    });

    test("Get a 404 error if isbn doesn't exist", async () => {
      const res = await request(app).delete('/books/0');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toEqual("There is no book with an isbn '0'");
    });
  });

  afterAll(async () => {
    await db.end();
  });
});