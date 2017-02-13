require 'date'
require 'fileutils'
require 'json'
require 'net/http'
require 'nokogiri'
require 'yaml'


desc "Build the Jekyll site."
task :build do
  sh %{jekyll build}
end

desc %{This deploys by using git subtree to push what's committed in the
_site directory to the origin/master branch.}

task :deploy, [:msg] => :build do |t, args|
  remote = 'git@github.com:Purdom/Purdom.github.io.git'
  branch = 'master'
  tmp_dir = '/tmp/gh-pages'
  msg = args[:msg] || 'Updates site.'

  FileUtils.rm_rf tmp_dir if Dir.exists? tmp_dir
  sh "git clone -b #{branch} #{remote} #{tmp_dir}"
  sh "cp -r #{tmp_dir}/.git _site/.git"
  sh "cd _site/ && git add . && git commit -am '#{msg}' && git push origin #{branch}"
end

desc %{Create an empty post file, pulling the correct resource URIs for the
title and author from WorldCat and VIAF.}

task :post, [:title, :author, :post_title] do |t, args|
  today      = Date.today
  title      = args[:title]      || 'Untitled'
  author     = args[:author]     || 'Anonymous'
  post_title = args[:post_title] || title
  slug       = post_title.gsub(/\W/, "-").downcase

  # VIAF
  query = "local.personalNames all \"#{author}\""
  params = {
    :query        => query,
    :sortKeys     => "holdingscount",
    :recordSchema => "BriefVIAF",
  }
  uri = URI("http://viaf.org/viaf/search")
  uri.query = URI.encode_www_form(params)
  req = Net::HTTP::Get.new(uri)
  req['Accept'] = 'application/json'
  res = Net::HTTP.start(uri.hostname, uri.port) do |http|
    http.request(req)
  end
  viaf_json = JSON.parse(res.body)
  viaf_id = viaf_json['searchRetrieveResponse']['records'][0]['record']\
    ['recordData']['viafID']['#text']
  author_info = {
    "name"     => author,
    "resource" => "http://viaf.org/viaf/" + viaf_id,
    "typeof"   => "Person"
  }

  # WorldCat
  query = "ti:#{title} au:#{author}"
  params = {
    :q      => query,
    :qt     => "advanced",
    :dblist => "638",
    :fq     => 'x0:book'
  }
  uri = URI("http://www.worldcat.org/search")
  uri.query = URI.encode_www_form(params)
  res = Net::HTTP.get_response(uri)
  html_doc = Nokogiri::HTML(res.body)
  wc_id = html_doc.css('.result.details .oclc_number')[0].children[0].content
  worldcat = "http://www.worldcat.org/oclc/#{wc_id}"

  header = {
    "title"      => post_title,
    "date"       => today,
    "layout"     => "book",
    "categories" => "book",
    "author"     => author_info,
    "resource"   => worldcat,
    "typeof"     => "Work"
  }

  output_file = "_posts/#{today.strftime('%Y-%m-%d')}-#{slug}.md"
  puts "Writing post to #{output_file}"
  open(output_file, 'w') do |file_out|
    file_out.write(header.to_yaml)
    file_out.write("---\n\n")
  end
end
