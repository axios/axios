import fs from 'node:fs';
import axios from 'axios';
import { printSuccessMessage, printErrorMessage, printInfoMessage } from './utils.js';

/**
 * Special configuration for processing sponsor data.
 */
const config = {
  legacyAgreements: {
    Stytch: 'gold',
    Airbnb: 'silver',
    Descope: 'gold',
    'Principal Financial Group': 'gold',
  },
  sponsorsToIgnore: ['axios'],
};

/**
 * The GraphQL query to get all sponsors.
 *
 * @type {string}
 */
const getAllSponsorsQuery = `
query Account {
  account(githubHandle: "https://github.com/axios") {
    name
    slug
    members(role: BACKER) {
      totalCount
      nodes {
        account {
          name
          slug
          socialLinks {
            type
            url
            createdAt
            updatedAt
          }
          website
          imageUrl
          legalName
          description
        }
        tier {
          name
        }
        totalDonations {
          value
          currency
        }
        since
      }
    }
  }
}
`;

/**
 * The GraphQL query to get all active sponsors.
 *
 * @type {string}
 */
const getActiveSponsorsQuery = `
query Account {
  account(githubHandle: "https://github.com/axios") {
    orders(onlyActiveSubscriptions: true, onlySubscriptions: true, frequency: MONTHLY, status: ACTIVE) {
      totalCount
      nodes {
        tier {
          name
        }
        fromAccount {
          id
          name
          socialLinks {
            type
            url
          }
          imageUrl
          legalName
          description
          website
          slug
        }
        amount {
          currency
          value
        }
        totalDonations {
          value
          currency
        }
      }
    }
  }
}
`;

/**
 * Gets all sponsors.
 *
 * @returns {Promise<any>} The sponsors.
 */
const getAllSponsors = async () => {
  printInfoMessage('getting all sponsors...');
  const response = await axios.post('https://api.opencollective.com/graphql/v2', {
    query: getAllSponsorsQuery,
  });

  return response.data.data;
};

/**
 * Gets all active sponsors.
 *
 * @returns {Promise<any>} The active sponsors.
 */
const getActiveSponsors = async () => {
  printInfoMessage('getting active sponsors...');
  const response = await axios.post('https://api.opencollective.com/graphql/v2', {
    query: getActiveSponsorsQuery,
  });

  return response.data.data;
};

/**
 * Builds a URL with UTM parameters.
 *
 * @param {string} url - The URL to build.
 * @param {boolean} bypass - Whether to bypass UTM parameters.
 * @returns {string} The URL with UTM parameters.
 */
const buildLinks = (url, bypass = false) => {
  if (bypass) {
    return url;
  }

  try {
    const urlObject = new URL(url);

    const { searchParams } = urlObject;

    searchParams.set('utm_source', 'axios_docs_website');
    searchParams.set('utm_medium', 'website');
    searchParams.set('utm_campaign', 'axios_open_collective_sponsorship');

    return urlObject.toString();
  } catch {
    return url;
  }
};

/**
 * Formats all active sponsors.
 *
 * @param {any} sponsorsData - The sponsors data.
 * @returns {any} The formatted sponsor data.
 */
const formatActiveSponsorData = (sponsorsData) => {
  const getSponsorTier = (sponsor) => {
    if (config.legacyAgreements[sponsor.fromAccount.name]) {
      return config.legacyAgreements[sponsor.fromAccount.name];
    }

    if (sponsor.tier?.name.toLowerCase() === 'silver sponsor') {
      return 'silver';
    }

    return sponsor.tier?.name.toLowerCase() || 'backer';
  };

  const processedData = sponsorsData
    .map((sponsor) => ({
      name: sponsor.fromAccount.name ?? 'Backer',
      imageUrl: sponsor.fromAccount.imageUrl ?? null,
      description: sponsor.fromAccount.description ?? null,
      tier: getSponsorTier(sponsor),
      slug: sponsor.fromAccount.slug,
      website: sponsor.fromAccount.website
        ? buildLinks(sponsor.fromAccount.website)
        : (buildLinks(
            sponsor.fromAccount.socialLinks.find((link) => link.type === 'WEBSITE')?.url
          ) ?? null),
      twitter:
        buildLinks(sponsor.fromAccount.socialLinks.find((link) => link.type === 'TWITTER')?.url) ??
        null,
    }))
    .filter((sponsor) => !config.sponsorsToIgnore.includes(sponsor.name));

  return processedData;
};

/**
 * Formats all sponsors irrespective state.
 *
 * @param {any} sponsorsData - The sponsors data.
 * @returns {any} The formatted sponsor data.
 */
const formatAllSponsorData = (sponsorsData) => {
  const getSponsorTier = (sponsor) => {
    if (config.legacyAgreements[sponsor.account.name]) {
      return config.legacyAgreements[sponsor.account.name];
    }

    if (sponsor.tier?.name.toLowerCase() === 'silver sponsor') {
      return 'silver';
    }

    return sponsor.tier?.name.toLowerCase() || 'backer';
  };

  const processedData = sponsorsData
    .map((sponsor) => ({
      name: sponsor.account.name ?? 'Backer',
      imageUrl: sponsor.account.imageUrl ?? null,
      description: sponsor.account.description ?? null,
      tier: getSponsorTier(sponsor),
      slug: sponsor.account.slug,
      website: sponsor.account.website
        ? buildLinks(sponsor.account.website)
        : (buildLinks(sponsor.account.socialLinks.find((link) => link.type === 'WEBSITE')?.url) ??
          null),
      twitter:
        buildLinks(sponsor.account.socialLinks.find((link) => link.type === 'TWITTER')?.url) ??
        null,
    }))
    .filter((sponsor) => !config.sponsorsToIgnore.includes(sponsor.name));

  return processedData;
};

/**
 * The main process.
 */
const mainProcess = async () => {
  try {
    const allSponsors = await getAllSponsors();
    const activeSponsors = await getActiveSponsors();
    const allSponsorsProcessedData = formatAllSponsorData(allSponsors.account.members.nodes);
    const activeSponsorsProcessedData = formatActiveSponsorData(
      activeSponsors.account.orders.nodes
    );

    const sponsorsByTier = {};

    for (const sponsor of allSponsorsProcessedData) {
      sponsorsByTier[sponsor.tier] ||= [];

      const isActiveSponsor = activeSponsorsProcessedData.find(
        (activeSponsor) => activeSponsor.slug === sponsor.slug
      );

      if (isActiveSponsor) {
        sponsorsByTier[sponsor.tier].push({
          ...sponsor,
          active: true,
        });
      } else {
        sponsorsByTier[sponsor.tier].push({
          ...sponsor,
          active: false,
        });
      }
    }

    for (const sponsor of activeSponsorsProcessedData) {
      const isSponsorInAllSponsors = allSponsorsProcessedData.find(
        (allSponsor) => allSponsor.slug === sponsor.slug
      );

      if (!isSponsorInAllSponsors) {
        sponsorsByTier[sponsor.tier].push({
          ...sponsor,
          active: true,
        });
      }
    }

    fs.writeFileSync('./data/sponsors.json', JSON.stringify(sponsorsByTier, null, 2));

    printSuccessMessage('processed sponsors successfully!');
  } catch (_) {
    printErrorMessage('failed to process sponsors!');
    console.error(_);
  }
};

await mainProcess();
