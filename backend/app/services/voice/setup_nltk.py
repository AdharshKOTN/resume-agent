import nltk

def setup_nltk():
    try:
        nltk.data.find('taggers/averaged_perceptron_tagger_eng')
    except LookupError:
        print("🔄 Downloading NLTK tagger...")
        nltk.download('averaged_perceptron_tagger_eng')
    else:
        print("✅ NLTK tagger already available.")

if __name__ == "__main__":
    setup_nltk()
