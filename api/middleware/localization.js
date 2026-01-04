export const extractLocalization = (req, res, next) => {
  req.language = req.headers["accept-language"] || "en";

  req.country = req.headers["x-country-code"] || "US";

  console.log("Localization middleware:", {
    language: req.language,
    country: req.country,
    url: req.url,
  });

  next();
};
