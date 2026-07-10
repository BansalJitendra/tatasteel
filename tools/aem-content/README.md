# Tata Steel nav + footer content (for author instance)

The live site currently serves **boilerplate** nav/footer. These files install the
real Tata Steel nav and footer onto the AEM author instance.

## Files
- `tatasteel-nav-footer.zip` — ready-to-install CRX Package Manager package.
- `nav.content.xml` — the JCR for `/content/tatasteel/nav` (brand/logo, 7 nav dropdowns, tools row).
- `footer.content.xml` — the JCR for `/content/tatasteel/footer` (policy links, social links, copyright).

## Install (CRX Package Manager UI)
1. Download `tatasteel-nav-footer.zip` from this repo.
2. Open `https://author-p121857-e1908341.adobeaemcloud.com/crx/packmgr/index.jsp`
3. **Upload Package** -> select the zip -> **OK**
4. Click **Install** on the package row.

This creates `/content/tatasteel/nav` and `/content/tatasteel/footer`.

## Publish
Preview + publish both pages so Edge Delivery serves them (sidekick, or the
`admin.hlx.page` preview/publish endpoints). The header/footer blocks fetch
`/content/nav` and `/content/footer`.
