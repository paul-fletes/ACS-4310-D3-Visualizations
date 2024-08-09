async function draw() {
  // Data
  const dataset = await d3.csv('data.csv');

  const parseDate = d3.timeParse('%Y-%m-%d');
  const xAccessor = d => parseDate(d.date);
  const yAccessor = d => parseInt(d.close);

  // SVG Dimensions
  let dimensions = {
    width: 1000,
    height: 600,
    margin: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50
    },
  };

  // Container Dimensions
  dimensions.ctrWidth = dimensions.width - dimensions.margin.top * 2;
  dimensions.ctrHeight = dimensions.height - dimensions.margin.top * 2;

  // Draw Image
  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)

  const ctr = svg.append('g')
    .attr('transform', `translate(${dimensions.margin.top}, ${dimensions.margin.top})`)

  const tooltip = d3.select('#tooltip')
  const tooltipDot = ctr.append('circle')
    .attr('r', 5)
    .attr('fill', '#fc8781')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .style('opacity', 0)
    .style('pointer-events', 'none')

  // Scales
  const yScale = d3.scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.ctrHeight, 0])
    .nice()

  const xScale = d3.scaleUtc()
    .domain(d3.extent(dataset, xAccessor))
    .range([0, dimensions.ctrWidth])

  // Setup Generator
  const lineGenerator = d3.line()
    .x((d) => xScale(xAccessor(d)))
    .y((d) => yScale(yAccessor(d)))

  // Draw Line 
  ctr.append('path')
    .datum(dataset)
    .attr('d', lineGenerator)
    .attr('fill', 'none')
    .attr('stroke', '#30475e')
    .attr('stroke-width', 2)


  // Axes
  const xAxis = d3.axisBottom(xScale)

  ctr.append('g')
    .call(xAxis)
    .style('transform', `translateY(${dimensions.ctrHeight}px)`) // this sends axis to bottom of the chart!

  const yAxis = d3.axisLeft(yScale)
    .tickFormat((d) => `$${d}`)

  ctr.append('g')
    .call(yAxis)

  svg.append('text')
    .attr('x', dimensions.width / 2)
    .attr('y', dimensions.height - 10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .text('Date')

  svg.append('text')
    .attr('x', -dimensions.height / 2)
    .attr('y', 15)
    .attr('text-anchor', 'middle')
    .attr('transform', 'rotate(-90)')
    .attr('font-size', '16px')
    .text('Stock Price ($)');

  // Tooltip
  ctr.append('rect')
    .attr('width', dimensions.ctrWidth)
    .attr('height', dimensions.ctrHeight)
    .style('opacity', 0)
    .on('touchmouse mousemove', function (e) {
      const mousePosition = d3.pointer(e, this)

      // get Y coordinate
      const date = xScale.invert(mousePosition[0])

      // create custom bisector to compare dates
      const bisector = d3.bisector(xAccessor).left
      const index = bisector(dataset, date)
      const stock = dataset[index - 1]

      // update image
      tooltipDot.style('opacity', 1)
        .attr('cx', xScale(xAccessor(stock)))
        .attr('cy', yScale(yAccessor(stock)))
        .raise()

      tooltip.style('display', 'block')
        .style('top', yScale(yAccessor(stock)) - 20 + 'px')
        .style('left', xScale(xAccessor(stock)) + 'px')

      // set tooltip text
      tooltip.select('.price')
        .text(`$${yAccessor(stock)}`)

      const dateFormatter = d3.timeFormat('%B %-d, %Y')

      tooltip.select('.date')
        .text(`${dateFormatter(xAccessor(stock))}`)
    })
    .on('mouseleave', function (e) { //removes tooltip when hovering away from chart
      tooltipDot.style('opacity', 0)
      tooltip.style('display', 'none')
    })
}

draw()