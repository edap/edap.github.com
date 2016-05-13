require "rubygems"
require 'rake'
require 'yaml'
require 'time'

SOURCE = "."
CONFIG = {
  'version' => "0.2.9",
  'layouts' => File.join(SOURCE, "_layouts"),
  'posts' => File.join(SOURCE, "_posts"),
  'projects' => File.join(SOURCE, "_projects"),
  'post_ext' => "md",
  'project_ext' => "md",
  'theme_package_version' => "0.1.0"
}

# Usage: rake post title="A Title" [date="2012-02-09"]
desc "Begin a new post in #{CONFIG['posts']}"
task :post do
  abort("rake aborted: '#{CONFIG['posts']}' directory not found.") unless FileTest.directory?(CONFIG['posts'])
  title = ENV["title"] || "new-post"
  slug = title.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
  begin
    date = (ENV['date'] ? Time.parse(ENV['date']) : Time.now).strftime('%Y-%m-%d')
  rescue Exception => e
    puts "Error - date format must be YYYY-MM-DD, please check you typed it correctly!"
    exit -1
  end
  filename = File.join(CONFIG['posts'], "#{date}-#{slug}.#{CONFIG['post_ext']}")
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end
  
  puts "Creating new post: #{filename}"
  open(filename, 'w') do |post|
    post.puts "---"
    post.puts "layout: post"
    post.puts "title: \"#{title.gsub(/-/,' ')}\""
    post.puts "category: "
    post.puts "tags: []"
    post.puts "---"
  end
end # task :post

# Usage: rake project title="A Title"
desc "Begin a new project in #{CONFIG['projects']}"
task :project do
  abort("rake aborted: '#{CONFIG['projects']}' directory not found.") unless FileTest.directory?(CONFIG['projects'])
  title = ENV["title"] || "new-project"
  slug = title.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
  filename = File.join(CONFIG['projects'], "/#{slug}.#{CONFIG['project_ext']}")
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end
  
  puts "Creating new project: #{filename}"
  open(filename, 'w') do |project|
    project.puts "---"
    project.puts "layout: project"
    project.puts "title: \"#{title.gsub(/-/,' ')}\""
    project.puts "category: "
    project.puts "tags: []"
    project.puts "---"
  end
end # task :project

# Usage: rake page name="about.html"
# You can also specify a sub-directory path.
# If you don't specify a file extention we create an index.html at the path specified
desc "Create a new page."
task :page do
  name = ENV["name"] || "new-page.md"
  filename = File.join(SOURCE, "#{name}")
  filename = File.join(filename, "index.md") if File.extname(filename) == ""
  title = File.basename(filename, File.extname(filename)).gsub(/[\W\_]/, " ").gsub(/\b\w/){$&.upcase}
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end
  
  mkdir_p File.dirname(filename)
  puts "Creating new page: #{filename}"
  open(filename, 'w') do |post|
    post.puts "---"
    post.puts "layout: page"
    post.puts "title: \"#{title}\""
    post.puts "---"
  end
end 
# Internal: Process theme package manifest file.
#
# theme_path - String, Required. File path to theme package.
#        
# Returns theme manifest hash
def verify_manifest(theme_path)
  manifest_path = File.join(theme_path, "manifest.yml")
  manifest_file = File.open( manifest_path )
  abort("rake aborted: repo must contain valid manifest.yml") unless File.exist? manifest_file
  manifest = YAML.load( manifest_file )
  manifest_file.close
  manifest
end

def ask(message, valid_options)
  if valid_options
    answer = get_stdin("#{message} #{valid_options.to_s.gsub(/"/, '').gsub(/, /,'/')} ") while !valid_options.include?(answer)
  else
    answer = get_stdin(message)
  end
  answer
end

def get_stdin(message)
  print message
  STDIN.gets.chomp
end

#Load custom rake scripts
Dir['_rake/*.rake'].each { |r| load r }
