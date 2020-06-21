[![Netlify Status](https://api.netlify.com/api/v1/badges/8fd7da5f-0c4d-4a43-9e23-2d1baf0d35cc/deploy-status)](https://app.netlify.com/sites/hugo-novela-forestry/deploys)

## Prerequisites

- Hugo > 0.55.0

## Content Management

![Forestry user interface](images/novela-forestry.png)

This project has been pre-configured to work with [Forestry](https://forestry.io) and [Netlify](https://netlify.com).

## Deployment and hosting with Netlify

Import your site in [Netlify](https://netlify.com)

1. Create a new site in Netlify and import your repository.
2. Set the build command to: `hugo --gc --minify`
3. Set the publish directory to: `public`
4. Make sure to set `HUGO_VERSION` to 0.55.0 or above (tested with 0.62.2)

## Development

```bash
# 1. clone the repository

# 2. Initialize theme submodule(s)
git submodule update --init --recursive

# 3. Start local dev server
hugo server
```

For more information, see [official Hugo documentation](https://gohugo.io/getting-started/).

## Customization

### Socials

Defined in `config/_default/social.yaml`.

#### Assigning authors to posts.

Add the name of the author to the "authors" field:

```yaml
authors:
  - Dennis Brotzky
  - Thiago Costa
```

### Newsletter call to action

This theme includes a shortcode for a newsletter callout form that you can add to any page.
It uses [formspree.io](//formspree.io/) as proxy to send the actual email. Each month, visitors can send you up to one thousand emails without incurring extra charges. Visit the Formspree site to get get going add your Formspree email to your shortcode like this:

```
{{< subscribe email="your@email.com" >}}
```

## LICENSE

MIT
