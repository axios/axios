/**
 * Selects the most recent membership for each sponsor slug.
 * A valid timestamp takes precedence over a missing or invalid timestamp.
 * When neither timestamp is valid, the first membership is retained.
 *
 * @param {any[]} sponsorsData - The sponsor memberships.
 * @returns {Map<string, any>} The latest membership keyed by sponsor slug.
 */
export const selectLatestSponsorsBySlug = (sponsorsData) =>
  sponsorsData.reduce((sponsorsBySlug, sponsor) => {
    const slug = sponsor.account.slug;
    const existingSponsor = sponsorsBySlug.get(slug);

    if (!existingSponsor) {
      sponsorsBySlug.set(slug, sponsor);
      return sponsorsBySlug;
    }

    const sponsorSince = Date.parse(sponsor.since);
    const existingSponsorSince = Date.parse(existingSponsor.since);
    const sponsorSinceIsValid = !Number.isNaN(sponsorSince);
    const existingSponsorSinceIsValid = !Number.isNaN(existingSponsorSince);

    if (
      sponsorSinceIsValid &&
      (!existingSponsorSinceIsValid || sponsorSince > existingSponsorSince)
    ) {
      sponsorsBySlug.set(slug, sponsor);
    }

    return sponsorsBySlug;
  }, new Map());
