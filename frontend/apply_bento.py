import os
import re

bento_map = {
    'void': '#050810',
    'navy': '#0B111C',
    'surface': '#161F2D',
    'steel': '#2A3446',
    'mist': '#97A0B3',
    'periwinkle': '#BCCCE6',
    'glow': '#7FA0D6',
    'sand': '#D8BF9B'
}

def clean_classes(text):
    # Remove gradients
    text = re.sub(r'bg-gradient-to-[a-z]+', '', text)
    text = re.sub(r'from-[a-zA-Z0-9_/-]+', '', text)
    text = re.sub(r'via-[a-zA-Z0-9_/-]+', '', text)
    text = re.sub(r'to-[a-zA-Z0-9_/-]+', '', text)
    
    # Remove shadows
    text = re.sub(r'shadow-(sm|md|lg|xl|2xl|inner|none|xs|2xs)', '', text)
    text = re.sub(r'shadow-\[[^\]]+\]', '', text)
    text = re.sub(r'shadow-[a-zA-Z0-9]+/[0-9]+', '', text)
    
    # Remove blur glows
    text = re.sub(r'blur-[a-zA-Z0-9]+', '', text)
    text = re.sub(r'backdrop-blur-[a-zA-Z0-9]+', '', text)

    # Remap backgrounds
    # Inner cards / lighter backgrounds to Void
    text = re.sub(r'bg-slate-(50|100|200)(/[0-9]+)?', f'bg-[{bento_map["void"]}]', text)
    text = re.sub(r'bg-gray-(50|100|200)(/[0-9]+)?', f'bg-[{bento_map["void"]}]', text)
    text = re.sub(r'bg-white(/[0-9]+)?', f'bg-[{bento_map["surface"]}]', text)
    text = re.sub(r'bg-blue-50(/[0-9]+)?', f'bg-[{bento_map["void"]}]', text)
    text = re.sub(r'bg-amber-50(/[0-9]+)?', f'bg-[{bento_map["void"]}]', text)
    text = re.sub(r'bg-teal-50(/[0-9]+)?', f'bg-[{bento_map["void"]}]', text)
    text = re.sub(r'bg-orange-50(/[0-9]+)?', f'bg-[{bento_map["void"]}]', text)
    text = re.sub(r'bg-red-50(/[0-9]+)?', f'bg-[{bento_map["void"]}]', text)
    text = re.sub(r'bg-sky-[0-9]+(/[0-9]+)?', '', text) # Remove sky bg glows entirely
    text = re.sub(r'bg-indigo-[0-9]+(/[0-9]+)?', '', text)
    
    # Existing dark backgrounds -> Navy or Surface depending on context
    text = re.sub(r'bg-\[\#0D2137\]', f'bg-[{bento_map["navy"]}]', text)
    text = re.sub(r'bg-slate-900', f'bg-[{bento_map["navy"]}]', text)

    # Borders
    text = re.sub(r'border-[a-zA-Z]+-[123]00(/[0-9]+)?', f'border-[{bento_map["steel"]}]', text)
    text = re.sub(r'border-slate-[1234]00', f'border-[{bento_map["steel"]}]', text)

    # Text mapping
    text = re.sub(r'text-slate-(800|900|700)', f'text-[{bento_map["periwinkle"]}]', text)
    text = re.sub(r'text-gray-(800|900|700)', f'text-[{bento_map["periwinkle"]}]', text)
    text = re.sub(r'text-slate-(400|500|600)', f'text-[{bento_map["mist"]}]', text)
    text = re.sub(r'text-gray-(400|500|600)', f'text-[{bento_map["mist"]}]', text)
    
    # Specific buttons/accent text
    text = re.sub(r'bg-blue-600', f'bg-[{bento_map["periwinkle"]}] text-[{bento_map["navy"]}]', text)
    text = re.sub(r'text-blue-600', f'text-[{bento_map["glow"]}]', text)
    text = re.sub(r'text-amber-[678]00', f'text-[{bento_map["sand"]}]', text)

    # Clean up double spaces caused by replacements
    text = re.sub(r'\s+', ' ', text)
    text = text.replace('className=" ', 'className="')
    text = text.replace(' "', '"')
    return text

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = clean_classes(content)
                
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

process_directory('src')
