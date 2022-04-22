process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '0691161518',
        'http://a.co/eobPtX2',
        'Matthew Lane',
        'english',
        264,
        'Princeton University Press',
        'Power-Up: Unlocking the Hidden Mathematics in Video Games', 2017)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
});

describe("POST /books", function () {
  test("CREATE NEW BOOK", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "06911615312312312318",
      amazon_url: "http://gorays.com",
      author: "Ji-Man Choi",
      language: "Korean",
      pages: 10000000,
      publisher: "THE RAYS",
      title: "We're going to the world series",
      year: 2022,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });
});

describe("GET /books/:isbn", function () {
  test("GET BOOK BY ISBN", async function () {
    const response = await request(app).get(`/books/${book_isbn}`);
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Responds with 404 if can't find book in question", async function () {
    const response = await request(app).get(`/books/999`);
    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /books/:isbn", function () {
  test("UPDATE BOOK", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      amazon_url: "http://gorays.com",
      author: "Ji-Man Choi",
      language: "Korean",
      pages: 10000000,
      publisher: "THE RAYS",
      title: "We're going to the world series, IM SAYING IT NOW!",
      year: 2022,
    });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe(
      "We're going to the world series, IM SAYING IT NOW!"
    );
  });

  test("PREVENTS BOOK UPDATE DUE TO ISBN ADDED", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      isbn: "06911615312312312318",
      amazon_url: "http://gorays.com",
      author: "Ji-Man Choi",
      language: "Korean",
      pages: 10000000,
      publisher: "THE RAYS",
      title: "We're going to the world series, IM SAYING IT NOW!",
      year: 2022,
    });
    expect(response.statusCode).toBe(400);
  });

  test("Responds 404 if can't find book in question", async function () {
    await request(app).delete(`/books/${book_isbn}`);
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:isbn", function () {
  test("DELETE BOOK BY ISBN", async function () {
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});
