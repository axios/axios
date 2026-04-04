# Release cycle

A release cycle is the process of planning, developing, testing, and deploying a new version of a software project. The release cycle is an important part of the software development process, as it allows developers to deliver new features and bug fixes to users in a controlled and predictable manner.

## History

The release cycle of the project has been quite erratic in the past. This is due to the fact that the project is maintained by a small group of volunteers, who have other commitments. The project is also quite complex, and it takes a lot of time to prepare a release.

In the past, the project has gone for long periods without a release. This has caused frustration among users, who have had to wait for new features and bug fixes. The project has also had a number of releases that have introduced breaking changes, which has caused problems for users who rely on the project.

The project also spent a long time on version 0.x.x, which is a pre-release version. This meant that the project was not considered stable, and breaking changes could be introduced at any time. This made it difficult for users to rely on the project.

## Proposed release cycle

The project is now moving to a more regular release cycle. The project will aim to release a new minor version every 3 months. This will give users a predictable schedule for new releases, and will allow them to plan their upgrades accordingly.

We will plan each release in advance, and will aim to include a mix of new features, bug fixes, and performance improvements in each release. We will also aim to avoid introducing breaking changes in minor releases, so that users can upgrade without fear of their code breaking.

This planning will be done in the open, and we will seek feedback from the community on the features and bug fixes that should be included in each release. We will also aim to involve the community in the testing of each release, so that we can catch any bugs before they are released to users.

### Planning

All planning will be done using GitHub's project management tools. We will create a project board for each release, and will use it to track the progress of the release. We will also use GitHub issues to track the features and bug fixes that are planned for each release.

### Pre-release

A pre-release version of the project will be made available to users for testing. The pre-release will be updated at least weekly on a auto-build schedule. This will allow users to try out the new features and bug fixes before the final release. The pre-release version will be made available on through NPM using the `next` tag.

### Release

The final release will be made available to users on the release date. The release will be made available on NPM. The release will also be announced on the project's GitHub repository, and will include release notes that detail the new features and bug fixes that are included in the release.

### Versioning

The project will now strictly adhere to semantic versioning. This means that each release will be assigned a version number in the format `MAJOR.MINOR.PATCH`. To read more about semantic versioning, please visit [semver.org](https://semver.org/). To read more about the project's versioning policy, please visit [versioning](/pages/misc/semver).

### Deprecation

When a new version of the project is released for example v1.x.x, the previous major version will be marked as deprecated. This means that no new features or bug fixes will be added to the deprecated version, and users are encouraged to upgrade to the latest version. Deprecation will occur after 3 months of the release of the `next` version which will happing in conjunction with the next scheduled release. Thus allowing users 6 months to upgrade to the latest version.

### Security updates

Security updates will be released as soon as possible after the patch has been developed and tested. We will notify users of the release via the project's GitHub repository. We will also publish the release notes and security advisories on the project's GitHub releases page. We will also depreciate all versions that contain the security vulnerability.

### Backporting

Officially, we will only backport security updates to the v0.x.x version of the project. However, we will accept pull requests from the community to backport other updates to older versions of the project. These pull requests will be reviewed by the project maintainers, and will be merged if they meet the project's coding standards.

### LTS

The project will have a long-term support (LTS) version. The LTS version will be supported for 12 months after the release of the next major version. During this time, the LTS version will receive security updates and bug fixes. After the 12 months, the LTS version will be marked as deprecated, and users will be encouraged to upgrade to the latest version.

## v0.x.x

We will continue to support the v0.x.x version of the project till June 2025. This means that we will continue to release bug fixes and security updates for the v0.x.x version. However, no new features will be added to the v0.x.x version.

After June 2025, the v0.x.x version will be marked as deprecated, and users will be encouraged to upgrade to the latest version. The v0.x.x version will no longer receive bug fixes or security updates after this date.
