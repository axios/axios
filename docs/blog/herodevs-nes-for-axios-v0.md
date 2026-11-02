---
title: Security updates for Axios v0 with HeroDevs
date: 2026-11-02
author: Jason Saayman
description: HeroDevs now offers Never-Ending Support for Axios v0, with security fixes backed by an SLA for teams that can't move to v1 yet. Part of it goes back to funding the project.
image: /blog/herodevs-nes-for-axios-v0/cover.webp
imageAlt: HeroDevs Launches Never-Ending Support (NES) for Axios
---

I am happy to share that we have partnered with [HeroDevs](https://www.herodevs.com/) to offer [Never-Ending Support (NES) for Axios](https://www.herodevs.com/support/nes-for-axios), commercial security support for the Axios v0 line. If your team still runs v0 in production, this gives you security fixes with an SLA behind them, so you can plan your move to v1 on your own timeline.

HeroDevs has also published [their own announcement](https://www.herodevs.com/blog-posts/herodevs-launches-never-ending-support-nes-for-axios) with more detail on the product.

## Why v0 needs this

Axios 1.0 shipped in 2022, but v0 is still installed a lot. Some of that is direct, and a lot of it comes in through other packages: SDKs, agents, and tools that pinned an older version and have not released an update. The move to v1 also changed things like error handling, header handling, and how the package is resolved, so for some teams upgrading is a real project rather than a version bump.

We still release fixes on the `v0.x` branch, most recently 0.34.0. But Axios is maintained by a small group of people. We do not have a formal LTS schedule or end-of-life dates, and we cannot promise when a fix will land on v0. That is fine for a lot of projects, but if you need to show an auditor that every component in your SBOM is supported and patched within a set time, "the maintainers will probably backport it" is not an answer you can use.

The [supply chain compromise in March](https://github.com/axios/axios/issues/10636) hit both 1.x and 0.x, which is a good reminder that v0 users face the same risks as everyone else.

## What NES for Axios gives you

- **Security fixes for every severity,** shipped as drop-in replacement packages with no API changes.
- **Fix timelines backed by an SLA,** based on how severe the vulnerability is.
- **Time to migrate properly,** with v0 supported while you plan the move to v1.
- **A named vendor for compliance,** with a documented patch history.

Builds are available for Axios 0.24.x today. The [NES for Axios documentation](https://docs.herodevs.com/axios) has the current list of supported versions.

## How it works

You point npm at the NES registry and swap the `axios` package for the NES build. Your application code does not change. The `overrides` entry makes sure packages that depend on Axios get the patched version too:

```json
{
  "dependencies": {
    "axios": "npm:@neverendingsupport/axios@0.24.0-axios-0.24.4"
  },
  "overrides": {
    "axios": "npm:@neverendingsupport/axios@0.24.0-axios-0.24.4"
  }
}
```

This example uses the latest 0.24.x build at the time of writing. The [documentation](https://docs.herodevs.com/axios) has the current version and walks through setting up the registry.

## How this helps Axios

This is the part I care about most. Part of what HeroDevs earns from NES for Axios goes directly to funding the project. HeroDevs is already a Gold sponsor, and this partnership gives us more support to keep working on Axios for everyone. Teams that need guaranteed v0 support get it from people whose job it is to provide it.

Nothing changes about how Axios itself is run. It stays independently maintained and open source, and work on v1 carries on as normal.

## Getting started

If you run Axios v0 in production, have a look at the [NES for Axios product page](https://www.herodevs.com/support/nes-for-axios) or [contact the HeroDevs team](https://www.herodevs.com/contact). If you can move to v1, that is still the best option, and the [upgrade guide](/pages/getting-started/upgrade-guide#upgrading-from-v0-x-to-v1-x) covers what changed.

Thanks to HeroDevs for backing the project, and to everyone who keeps contributing to Axios.
