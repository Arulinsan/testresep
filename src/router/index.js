import express from "express";
import {
  getNewRecipes,
  getNewRecipesByPage,
  getRecipeDetail,
  searchRecipes,
} from "../controller/recipes.controller.js";

const route = express.Router();

route.get("/recipes", getNewRecipes);

// Updated search endpoint - now supports pagination with the page query parameter
route.get("/recipes/search", searchRecipes);
route.get("/recipes/:id", getNewRecipesByPage);
route.get("/recipe/:slug", getRecipeDetail);

export default route;
