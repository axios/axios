export default (pipeline) => {
  pipeline = pipeline.filter(Boolean);

  let l = pipeline.length;

  return (ctx, next) => {
    const dispatch = async (i, middlewareCtx) => {
      const fn = i === l ? next : pipeline[i]
      if (!fn) return;
      return await fn(
        middlewareCtx,
        (nextCtx) => dispatch(i + 1, nextCtx != null ? nextCtx : middlewareCtx)
      )
    }

    return dispatch(0, ctx);
  }
};
