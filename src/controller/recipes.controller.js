import axios from "axios";
import { BASE_URL } from "../constant/index.js";
import { load } from "cheerio";

//  GET NEW RECIPE
export const getNewRecipes = async (req, res) => {
  try {
    const { data } = await axios.get(`${BASE_URL}/resep`);
    const $ = load(data);

    const listItem = $("._recipes-list ._recipe-card .card");
    const resep = [];
    let slug, title, thumbnail, duration, difficulty;

    listItem.each((idx, el) => {
      title = $(el).find("h3 a").attr("data-tracking-value");
      thumbnail = $(el).find(".thumbnail img").attr("data-src");
      duration = $(el).find("._recipe-features span").text();
      difficulty = $(el)
        .find("._recipe-features a.icon_difficulty")
        .text()
        .trim();
      slug = $(el).find("h3 a").attr("href").split("/")[4];

      resep.push({
        slug,
        title,
        thumbnail,
        duration,
        difficulty,
      });
    });

    res.status(200).json({
      status: "Berhasil!",
      message: "Berhasil ambil data resep terbaru!",
      data: resep,
    });
  } catch (error) {
    res.status(404).json({
      status: "Gagal!",
      message: `Error: ${error.message}`,
    });
  }
};

// GET RECIPE BY PAGE
export const getNewRecipesByPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = await axios.get(`${BASE_URL}/resep/page/${id}`);
    const $ = load(data);

    const listItem = $("._recipes-list ._recipe-card .card");
    const resep = [];
    let slug, title, thumbnail, duration, difficulty;

    listItem.each((idx, el) => {
      title = $(el).find("h3 a").attr("data-tracking-value");
      thumbnail = $(el).find(".thumbnail img").attr("data-src");
      duration = $(el).find("._recipe-features span").text();
      difficulty = $(el)
        .find("._recipe-features a.icon_difficulty")
        .text()
        .trim();
      slug = $(el).find("h3 a").attr("href").split("/")[4];

      resep.push({
        slug,
        title,
        thumbnail,
        duration,
        difficulty,
      });
    });

    res.status(200).json({
      status: "Berhasil!",
      message: `Berhasil ambil data resep dihalaman ${id}!`,
      data: resep,
    });
  } catch (error) {
    res.status(404).json({
      status: "Gagal!",
      message: `Error: ${error.message}`,
    });
  }
};

// GET RECIPE DETAIL
export const getRecipeDetail = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data } = await axios.get(`${BASE_URL}/resep/${slug}`);
    const $ = load(data);

    const detail = $("main");
    const elIngredients = $("._recipe-ingredients");
    const elSteps = $("._recipe-steps");
    let title, thumbnail, user, releaseDate, description, duration, difficulty;
    let quantity, itemIngredient;
    let itemSteps;

    detail.each((idx, el) => {
      title = $(el).find("header h1").text().split("|")[0].trim();
      thumbnail = $(el).find(".recipe-image picture img").attr("src");
      user = $(el).find(".author").text().trim().split("|")[0].trim();
      releaseDate = $(el).find(".author").text().trim().split("|")[1].trim();
      duration = $(el)
        .find("._recipe-header ._recipe-features span")
        .text()
        .trim();
      difficulty = $(el)
        .find("._recipe-header ._recipe-features a.icon_difficulty")
        .text()
        .trim();
      description = $(el).find(".content p").first().text();
    });

    const author = {
      name: user,
      releaseDate,
    };

    // Ingredients
    let ingredientArr = [];
    elIngredients.find(".d-flex").each((idx, el) => {
      let item = "";
      quantity = $(el).find(".part").text().trim();
      itemIngredient = $(el).find(".item").text().trim().split("\r\t")[0];
      itemIngredient = itemIngredient.split("\t");
      if (itemIngredient[0] != "") {
        item =
          itemIngredient[0].trim() +
          " " +
          itemIngredient[itemIngredient.length - 1].replace("\n", "").trim();

        const ingredient = `${quantity} ${item}`;
        ingredientArr.push(ingredient);
      }
    });
    const ingredients = ingredientArr;

    // Step Step
    let stepArr = [];
    elSteps.find(".step").each((idx, el) => {
      itemSteps = $(el).find(".content p").text();

      stepArr.push(itemSteps);
    });
    const steps = stepArr;

    const resep = {
      title,
      thumbnail,
      duration,
      difficulty,
      description,
      author,
      ingredients,
      steps,
    };

    res.status(200).json({
      status: "Berhasil!",
      message: `Berhasil ambil data resep dihalaman ${slug}!`,
      data: resep,
    });
  } catch (error) {
    res.status(404).json({
      status: "Gagal!",
      message: `Error: ${error.message}`,
    });
  }
};

// SEARCH RECIPES - WITH OPTIONAL PAGINATION
export const searchRecipes = async (req, res) => {
  try {
    const { q, page = 1, all = "false" } = req.query;
    const pageNum = parseInt(page);
    const fetchAll = all.toLowerCase() === "true";

    if (!q) {
      return res.status(400).json({
        status: "Gagal!",
        message: "Query parameter 'q' is required",
      });
    }

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        status: "Gagal!",
        message: "Parameter 'page' harus berupa angka positif",
      });
    }

    // Function to scrape a single page of search results
    const scrapePage = async (url) => {
      const { data } = await axios.get(url);
      const $ = load(data);

      // Extract search results from the page
      const listItem = $("._recipes-list ._recipe-card .card");
      const pageResults = [];

      listItem.each((idx, el) => {
        const title = $(el).find("h3 a").attr("data-tracking-value");
        const thumbnail = $(el).find(".thumbnail img").attr("data-src");
        const duration = $(el).find("._recipe-features span").text();
        const difficulty = $(el)
          .find("._recipe-features a.icon_difficulty")
          .text()
          .trim();
        const slug = $(el).find("h3 a").attr("href").split("/")[4];

        pageResults.push({
          slug,
          title,
          thumbnail,
          duration,
          difficulty,
        });
      });

      // Extract pagination information
      const nextPageLink = $(".pagination .next.page-numbers").attr("href");
      const hasNextPage = $(".pagination .next.page-numbers").length > 0;
      const hasPrevPage = $(".pagination .prev.page-numbers").length > 0;

      // Try to find the last page number
      let lastPage = 1;
      $(".pagination .page-numbers").each((idx, el) => {
        const pageText = $(el).text();
        if (!isNaN(parseInt(pageText))) {
          const pageNumber = parseInt(pageText);
          if (pageNumber > lastPage) {
            lastPage = pageNumber;
          }
        }
      });

      return {
        results: pageResults,
        nextPageLink,
        hasNextPage,
        hasPrevPage,
        lastPage,
      };
    };

    if (fetchAll) {
      // If 'all=true', fetch all pages of results
      console.log(`Fetching ALL search results for query: "${q}"`);

      let allResults = [];
      let currentPageUrl = `${BASE_URL}/?s=${encodeURIComponent(q)}`;
      let pageCount = 0;
      const MAX_PAGES = 100; // Safety limit

      while (currentPageUrl && pageCount < MAX_PAGES) {
        pageCount++;
        console.log(`Fetching page ${pageCount}: ${currentPageUrl}`);

        const { results, nextPageLink } = await scrapePage(currentPageUrl);
        allResults = [...allResults, ...results];

        if (!nextPageLink) break;
        currentPageUrl = nextPageLink;
      }

      console.log(
        `Total recipes found: ${allResults.length} from ${pageCount} pages`
      );

      return res.status(200).json({
        status: "Berhasil!",
        message: `Berhasil mencari resep dengan kata kunci "${q}"!`,
        fetchMode: "all",
        totalRecipes: allResults.length,
        pagesScraped: pageCount,
        data: allResults,
      });
    } else {
      // Standard pagination mode - fetch only the requested page
      const searchUrl =
        pageNum === 1
          ? `${BASE_URL}/?s=${encodeURIComponent(q)}`
          : `${BASE_URL}/page/${pageNum}/?s=${encodeURIComponent(q)}`;

      console.log(`Fetching page ${pageNum} of search results for: "${q}"`);

      const { results, hasNextPage, hasPrevPage, lastPage } = await scrapePage(
        searchUrl
      );

      return res.status(200).json({
        status: "Berhasil!",
        message: `Berhasil mencari resep dengan kata kunci "${q}"!`,
        fetchMode: "paginated",
        pagination: {
          currentPage: pageNum,
          totalItemsOnPage: results.length,
          hasNextPage,
          hasPrevPage,
          lastPage,
        },
        data: results,
      });
    }
  } catch (error) {
    console.error(error);
    // Check if it's a 404 error specifically for the page not existing
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        status: "Gagal!",
        message: "Halaman yang diminta tidak ditemukan",
      });
    }

    res.status(500).json({
      status: "Gagal!",
      message: `Error: ${error.message}`,
    });
  }
};
