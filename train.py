import json
import torch
import os
from dotenv import load_dotenv
from transformers import GPT2LMHeadModel, GPT2Tokenizer, GPT2Config
from transformers import TextDataset, DataCollatorForLanguageModeling
from transformers import Trainer, TrainingArguments
import numpy as np
from sklearn.model_selection import train_test_split
from huggingface_hub import login

# Load environment variables
load_dotenv()

# Login to Hugging Face Hub
login(token=os.getenv('HUGGING_FACE_TOKEN'))

def load_dataset(file_path):
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data

def prepare_data(captions, tokenizer, test_size=0.1):
    # Create temporary files for training and validation
    with open('train.txt', 'w') as f_train, open('val.txt', 'w') as f_val:
        train_captions, val_captions = train_test_split(captions, test_size=test_size)
        
        for caption in train_captions:
            f_train.write(caption + '\n')
        
        for caption in val_captions:
            f_val.write(caption + '\n')

    # Create datasets
    train_dataset = TextDataset(
        tokenizer=tokenizer,
        file_path='train.txt',
        block_size=128
    )
    
    val_dataset = TextDataset(
        tokenizer=tokenizer,
        file_path='val.txt',
        block_size=128
    )
    
    return train_dataset, val_dataset

def main():
    # Load the captions
    captions = load_dataset('captions_cleaned.json')
    
    # Initialize tokenizer and model
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    tokenizer.pad_token = tokenizer.eos_token
    
    model = GPT2LMHeadModel.from_pretrained('gpt2')
    model.resize_token_embeddings(len(tokenizer))
    
    # Prepare datasets
    train_dataset, val_dataset = prepare_data(captions, tokenizer)
    
    # Initialize data collator
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False
    )
    
    # Set up training arguments
    training_args = TrainingArguments(
        output_dir="./caption_model",
        overwrite_output_dir=True,
        num_train_epochs=3,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        eval_steps=400,
        save_steps=800,
        warmup_steps=500,
        logging_dir='./logs',
        push_to_hub=True,
        hub_model_id="rahulgandhi248/socialsync-captioner",
        hub_strategy="every_save"
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        data_collator=data_collator,
        train_dataset=train_dataset,
        eval_dataset=val_dataset
    )
    
    # Train the model
    trainer.train()
    
    # Push to Hugging Face Hub
    trainer.push_to_hub()

if __name__ == "__main__":
    main() 