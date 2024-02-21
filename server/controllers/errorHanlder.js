const errorHandler = (error, ...args) => {
  const now = new Date();
  console.error(now.toJSON(), 'error condition: ');
  args.forEach((a) => console.error(a));
  console.error(now.toJSON(), `error summary: ${error}`);
  console.error(error);
};

module.exports = {
  errorHandler,
};
