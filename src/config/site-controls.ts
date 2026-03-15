import rawSiteControls from "./site-controls.json";

export type SiteFeatureFlags = {
  showNotes: boolean;
  showToc: boolean;
  showSearch: boolean;
  showComments: boolean;
};

export type SiteControls = {
  features: SiteFeatureFlags;
};

const defaultSiteControls: SiteControls = {
  features: {
    showNotes: false,
    showToc: false,
    showSearch: true,
    showComments: false,
  },
};

const siteControls = {
  features: {
    ...defaultSiteControls.features,
    ...(rawSiteControls.features ?? {}),
  },
} satisfies SiteControls;

export { defaultSiteControls, siteControls };
