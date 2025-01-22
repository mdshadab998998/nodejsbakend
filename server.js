const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/compare-price", async (req, res) => {
  const { productUrl } = req.body;
  console.log(productUrl);

  if (!productUrl) {
    return res.status(400).json({ error: "Product URL is required" });
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Fetch product details from the provided URL
    await page.goto(productUrl);
    let productName, productPrice;

    if (productUrl.includes("flipkart.com")) {
      productName = await page.$eval(".VU-ZEz", (el) => el.textContent);
      productPrice = await page.$eval(".Nx9bqj", (el) => el.textContent);
    } else if (productUrl.includes("amazon.in")) {
      productName = await page.$eval("#productTitle", (el) =>
        el.textContent.trim()
      );
      productPrice = await page.$eval(".a-price-whole", (el) =>
        el.textContent.trim()
      );
    } else {
      return res.status(400).json({ error: "Unsupported URL" });
    }

    // Search for the product on the other platform
    const searchUrl = productUrl.includes("flipkart")
      ? `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`
      : `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;

    await page.goto(searchUrl);
    const otherPrice = productUrl.includes("flipkart")
      ? await page.$eval(".a-price-whole", (el) => el.textContent.trim())
      : await page.$eval("._1vC4OE._3qQ9m1", (el) => el.textContent);

    await browser.close();

    res.json({
      productName,
      sourcePrice: productPrice,
      otherPrice,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch product details" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
