# SocialSync

SocialSync is a modern social media management platform that allows users to schedule and manage Instagram posts efficiently. Built with Vite, Supabase, and Instagram API integration.

## Features

- Instagram Business Account Integration
- Post Scheduling
- Media Management
- Analytics Dashboard
- Multi-account Support

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Supabase
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Hosting:** Vercel
- **API Integration:** Instagram API, Google API, Ticketmaster API

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/rahulgandhi0/Socialsync.git
cd Socialsync
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with the following variables:
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Instagram API Configuration
VITE_INSTAGRAM_APP_ID=your_instagram_app_id
VITE_INSTAGRAM_APP_SECRET=your_instagram_app_secret
VITE_INSTAGRAM_REDIRECT_URI=your_redirect_uri
VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id
VITE_INSTAGRAM_USERNAME=your_instagram_username
VITE_FACEBOOK_ACCESS_TOKEN=your_facebook_access_token

# Google API Configuration
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Ticketmaster API Configuration
VITE_TICKETMASTER_KEY=your_ticketmaster_api_key

# Storage Configuration
VITE_SUPABASE_STORAGE_URL=your_supabase_storage_url
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables Guide

### Required Environment Variables

1. **Supabase Configuration**
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_SUPABASE_STORAGE_URL`: Your Supabase storage URL

2. **Instagram API Configuration**
   - `VITE_INSTAGRAM_APP_ID`: Your Instagram App ID
   - `VITE_INSTAGRAM_APP_SECRET`: Your Instagram App Secret
   - `VITE_INSTAGRAM_REDIRECT_URI`: OAuth redirect URI
   - `VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID`: Your Instagram Business Account ID
   - `VITE_INSTAGRAM_USERNAME`: Your Instagram username
   - `VITE_FACEBOOK_ACCESS_TOKEN`: Long-lived Facebook access token

3. **Google API Configuration**
   - `VITE_GOOGLE_API_KEY`: Your Google API key
   - `VITE_GOOGLE_SEARCH_ENGINE_ID`: Your Custom Search Engine ID

4. **Ticketmaster API Configuration**
   - `VITE_TICKETMASTER_KEY`: Your Ticketmaster API key

### Security Notes

- Never commit the `.env` file to version control
- Keep your API keys and secrets secure
- Rotate keys periodically
- Use appropriate key restrictions and API permissions

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

# Caption Model Training

This project uses Hugging Face's transformers library to fine-tune a GPT-2 model for generating image captions.

## Setup

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Training

1. Make sure your `captions_cleaned.json` file is in the root directory
2. Run the training script:
```bash
python train.py
```

The model will be saved in the `./caption_model` directory, and training logs will be available in the `./logs` directory.

## Model Details

- Base model: GPT-2
- Training epochs: 3
- Batch size: 4
- The model automatically splits the data into training and validation sets (90/10 split)
- Uses dynamic padding and attention masking
- Includes warmup steps and evaluation during training

## Monitoring Training

You can monitor the training progress using TensorBoard:
```bash
tensorboard --logdir=./logs
``` 