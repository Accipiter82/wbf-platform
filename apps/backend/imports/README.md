# Organisation Import Instructions

## Folder Structure

- `organisation_template.csv`: CSV template for client to fill in organisation data.
- `organisation_seed.csv`: Example CSV with 10 sample organisations.
- `images/`: Folder for organisation images.
  - Each organisation should have a subfolder named after the organisation (matching the CSV), containing:
    - `cover.jpg`: Cover image
    - `logo.jpg`: Logo image

## How to Use

1. **Fill in the CSV**
   - Use `organisation_template.csv` as a template.
   - Add your organisation data, one row per organisation.
   - For array fields, use `;` as a separator.
   - For images, place `cover.jpg` and `logo.jpg` in `images/ORG_NAME/`.

2. **Prepare Images**
   - For each organisation, create a folder in `images/` with the organisation's name.
   - Place `cover.jpg` and `logo.jpg` in that folder.

3. **Run the Migration Script**
   - The script will:
     - Read the CSV.
     - Check if the organisation already exists in Firebase (by ID or name).
     - If missing, upload the organisation data and images to Firebase/Firestore and Firebase Storage.

4. **Reusability**
   - You can reuse this process for future migrations by updating the CSV and images.

## Example

```
imports/
  organisation_template.csv
  organisation_seed.csv
  images/
    Green Earth Foundation/
      cover.jpg
      logo.jpg
    Community Development Network/
      cover.jpg
      logo.jpg
    ...
``` 