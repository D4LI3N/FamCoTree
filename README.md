# FamCoTree

[![badge](https://img.shields.io/badge/license-MIT-success.svg)](https://opensource.org/license/mit)
[![badge](https://img.shields.io/badge/support-PayPal-blue.svg)](https://paypal.me/d4li3n)
[![badge](https://img.shields.io/badge/publication-danielthecyberdude.com-purple.svg)](https://danielthecyberdude.com/project/famcotree)
[![Netlify Status](https://api.netlify.com/api/v1/badges/e03a33ff-5b6b-48f7-af54-2ddc47c8a0ed/deploy-status)](https://app.netlify.com/sites/famcotree/deploys)

![badge](https://img.shields.io/badge/technology-SvelteKit-green.svg)
![badge](https://img.shields.io/badge/technology-JavaScript-green.svg)
![badge](https://img.shields.io/badge/technology-HTML-green.svg)
![badge](https://img.shields.io/badge/technology-CSS-green.svg)
![badge](https://img.shields.io/badge/technology-GoJS-green.svg)

![header image](https://github.com/D4LI3N/FamCoTree/blob/main/x.png?raw=true)

**FamCoTree** ia a tool for creating interactive family trees by importing contacts from third party Contacts Apps, in VCF or CSV (Google Contacts) formats. Map relationships, edit contact details, and export data in SVG, PNG, CSV, or VCF formats for efficient integration and management of contact databases.

# Project Features

- Cross-platform
- Single codebase
- Data persistance (localStorage)

# Operation

## Usage

Go to [famcotree.danielthecyberdude.com](https://famcotree.danielthecyberdude.com),
then on the homepage, there will be 3 options:

- Choose file - Import existing contacts in CSV or VCF formats
- Start from scratch - Create contacts scheme from scratch
- Continue - Continue working on existing tree (only shown if there was any progress beforehand)

Edit your contacts "scheme" and export it in the next formats, as data:

- CSV - Coogle Contacts compatible CSV
- VCF - VCARD V3.0

as an image:

- SVG - medium comaptibiliy, no loss in quality (recommended)
- PNG - best compatibility, limited quality (not for big diagrams)

or you can even share diagrams SVG directly by URL or QR code that expires (removes it) after 24h.
(only the diagrams visual scheme is being shared, not full scheme/information)

# Technology Overview

## Software:

- SvelteKit
- JavaScript
- HTML
- CSS
- GoJS

# Credits

- [file.io](https://file.io) - allows temporary media hosting
- [goqr.me](https://goqr.me) - used for generating QR codes of shareable SVG's

# Releases

[![badge](https://img.shields.io/badge/Web-0078D6?style=flat&logo=svelte&logoColor=white&color=red)](https://famcotree.danielthecyberdude.com)
<br>

**Note:** You are welcome to contribute to the project, as well to report bugs :)
