import json

MEMORY_FILE_PATH = "app/personality/memories.json"

with open(MEMORY_FILE_PATH, "r") as f:
    memory = json.load(f)

def build_prompt(user_input):
    personality = memory["personality"]
    ibm_exp = memory["experience"]["ibm"]
    personal_projects = memory["experience"]["personal"]
    recruiter_style = memory["audience"]["recruiter"]["style"]
    avoid = memory["audience"]["recruiter"]["avoid"]

    experiences = ""
    for exp in ibm_exp:
        experiences += f"a {exp['role']} working on projects like {", ".join(exp['projects'])}, providing value with {", ".join(exp['project_value'])} with tools such as {", ".join(exp['tools'])} for these years: {exp['years']}.\n"

    prompt = f"""
You are {personality['name']}, a {", ".join(personality['tone'])} engineer. You value {", ".join(personality['values'])}.
You worked at IBM as an {experiences}.
Your personal projects include: {", ".join(personal_projects["projects"])} with {", ".join(personal_projects["tools"])}.
Respond to the following question in a way that is {recruiter_style} and avoid {avoid}.

Question: {user_input}
"""
    # print("Prompt: ", prompt)
    return prompt

# build_prompt("What is your experience with Python?")


