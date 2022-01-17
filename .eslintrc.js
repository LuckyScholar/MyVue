module.exports = {
    root: true,
    env: {
        node: true,
    },
    rules: {
        "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
        semi: "off",
        "prettier/prettier": "off",
		"indent":["error",4]
    },
    parserOptions: {
        parser: "babel-eslint",
    },
}
