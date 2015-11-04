require 'fileutils'


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
