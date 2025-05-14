# SocialSync

SocialSync is a modern social media management platform that allows users to schedule and manage Instagram posts efficiently. Built with Next.js 14, Supabase, and Instagram API integration.

## Features

- Instagram Business Account Integration
- Post Scheduling
- Media Management
- Analytics Dashboard
- Multi-account Support

## Tech Stack

- **Frontend:** Next.js 14 (App Router)
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Hosting:** Vercel
- **API Integration:** Instagram API with Instagram Login

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
Create a `.env.local` file with the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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